const crypto = require("crypto");
const mongoose = require("mongoose");

const CrmInteraction = require("../models/CrmInteraction");
const CrmSalesRecord = require("../models/CrmSalesRecord");
const SalesRep = require("../models/SalesRep");
const School = require("../models/School");
const SurveyDispatch = require("../models/SurveyDispatch");
const { NIGERIAN_STATES } = require("../constants/crm");
const asyncHandler = require("../utils/asyncHandler");
const { sendSurveyEmail } = require("../mailtrap/email");
const { sendSurveySms } = require("../sms/xwireless");

const normalizePhoneNumber = (value = "") => value.replace(/\D/g, "");

const getStoredPhoneFields = (phoneNumber = "") => {
  const phone = (phoneNumber || "").trim();
  const normalizedPhoneNumber = normalizePhoneNumber(phone);

  return {
    phoneNumber: phone,
    normalizedPhoneNumber: normalizedPhoneNumber || null,
  };
};

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const capitalizeWords = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  return { limit, page, skip };
};

const parseDateBoundary = (value, endOfDay = false) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
};

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDashboardDateRange = (query) => {
  const period = query.period || "all";

  if (period === "all") {
    return null;
  }

  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  if (period === "week") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diffToMonday);
    return { period, startDate: start, endDate: endOfToday };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return { period, startDate: start, endDate: endOfToday };
  }

  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    return { period, startDate: start, endDate: endOfToday };
  }

  if (period === "custom") {
    const startDate = parseDateBoundary(query.startDate, false);
    const endDate = parseDateBoundary(query.endDate, true);

    if (!startDate || !endDate) {
      const error = new Error("Custom period requires valid startDate and endDate (YYYY-MM-DD)");
      error.statusCode = 400;
      throw error;
    }

    if (startDate > endDate) {
      const error = new Error("startDate must be before or equal to endDate");
      error.statusCode = 400;
      throw error;
    }

    return { period, startDate, endDate };
  }

  return null;
};

const applyDateRange = (filter, field, dateRange) => {
  if (!dateRange) {
    return filter;
  }

  return {
    ...filter,
    [field]: {
      $gte: dateRange.startDate,
      $lte: dateRange.endDate,
    },
  };
};

const canManageAllCrmRecords = (user) =>
  user?.role === "csrAdmin" || user?.role === "admin";

const buildInteractionAccessFilter = (user) =>
  canManageAllCrmRecords(user) ? {} : { owner: user._id };

const buildSalesRecordAccessFilter = (user) =>
  canManageAllCrmRecords(user) ? {} : { owner: user._id };

const buildInteractionFilter = (query, user) => {
  const filter = { ...buildInteractionAccessFilter(user) };

  if (query.direction) {
    filter.direction = query.direction;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.state) {
    filter["customer.state"] = query.state;
  }

  if (query.organizationType) {
    filter["customer.organizationType"] = query.organizationType;
  }

  if (query.owner && canManageAllCrmRecords(user)) {
    filter.owner = query.owner;
  }

  if (query.salesRep) {
    filter.salesRep = query.salesRep;
  }

  if (query.customerType) {
    filter.customerType = query.customerType;
  }

  if (query.search) {
    const search = query.search.trim();
    const phoneSearch = normalizePhoneNumber(search);
    filter.$or = [
      { "customer.schoolName": new RegExp(search, "i") },
      { "customer.address": new RegExp(search, "i") },
      { "customer.phoneNumber": new RegExp(search, "i") },
      ...(phoneSearch ? [{ "customer.normalizedPhoneNumber": phoneSearch }] : []),
    ];
  }

  return filter;
};

const buildSalesRecordFilter = (query, user) => {
  const dateRange = parseDashboardDateRange(query);
  const filter = applyDateRange(
    { ...buildSalesRecordAccessFilter(user) },
    "saleDate",
    dateRange
  );
  const conditions = [];

  if (query.bookClass) {
    conditions.push({
      $or: [{ bookClass: query.bookClass }, { "bookItems.bookClass": query.bookClass }],
    });
  }

  if (query.organizationType) {
    filter.organizationType = query.organizationType;
  }

  if (query.owner && canManageAllCrmRecords(user) && mongoose.Types.ObjectId.isValid(query.owner)) {
    filter.owner = query.owner;
  }

  if (query.search) {
    const search = query.search.trim();
    conditions.push({
      $or: [
        { schoolName: new RegExp(search, "i") },
        { location: new RegExp(search, "i") },
        { bookTitles: new RegExp(search, "i") },
        { "bookItems.title": new RegExp(search, "i") },
      ],
    });
  }

  if (conditions.length) {
    filter.$and = conditions;
  }

  return filter;
};

const ensureSalesRep = async (salesRepId) => {
  if (!salesRepId) {
    return null;
  }

  if (!mongoose.Types.ObjectId.isValid(salesRepId)) {
    const error = new Error("Invalid sales rep selected");
    error.statusCode = 400;
    throw error;
  }

  const salesRep = await SalesRep.findById(salesRepId);

  if (!salesRep) {
    const error = new Error("Sales rep not found");
    error.statusCode = 404;
    throw error;
  }

  return salesRep;
};

const resolveSalesRepId = (body, existingInteraction = null) => {
  if (body.salesRep === undefined) {
    return existingInteraction?.salesRep ?? null;
  }

  return body.salesRep || null;
};

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const clampPercent = (value) => Math.min(100, Math.max(0, roundMoney(value)));

const CSR_USER_FIELDS = "name csrDisplayName staffId role";

const getCsrDisplayName = (user) => user?.csrDisplayName || user?.name || "";

const buildSalesRecordBookPayload = (body) => {
  const submittedItems = Array.isArray(body.bookItems) ? body.bookItems : [];
  const bookItems = submittedItems
    .map((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const price = roundMoney(item.price);
      const discountPercent = clampPercent(
        item.discountPercent === undefined ? body.discountPercent : item.discountPercent
      );
      const subtotalPrice = roundMoney(price * quantity);
      const discountAmount = roundMoney((subtotalPrice * discountPercent) / 100);
      const totalPrice = roundMoney(Math.max(0, subtotalPrice - discountAmount));

      return {
        title: capitalizeWords(item.title || ""),
        bookClass: item.bookClass || body.bookClass,
        price,
        quantity,
        discountPercent,
        discountAmount,
        subtotalPrice,
        totalPrice,
      };
    })
    .filter((item) => item.title);

  const fallbackTitles = capitalizeWords(body.bookTitles || "");
  const bookTitles = bookItems.length
    ? bookItems.map((item) => item.title).join(", ")
    : fallbackTitles;
  const subtotalPrice = roundMoney(
    bookItems.reduce((total, item) => total + item.subtotalPrice, 0)
  );
  const discountAmount = roundMoney(
    bookItems.reduce((total, item) => total + item.discountAmount, 0)
  );
  const totalPrice = roundMoney(bookItems.reduce((total, item) => total + item.totalPrice, 0));
  const quantitySold = bookItems.length
    ? bookItems.reduce((total, item) => total + item.quantity, 0)
    : Number(body.quantitySold);

  return {
    bookTitles,
    bookItems,
    quantitySold,
    subtotalPrice,
    discountPercent: body.discountPercent ? clampPercent(body.discountPercent) : 0,
    discountAmount,
    totalPrice,
  };
};

const buildInteractionPayload = async (body, user, existingInteraction = null) => {
  const phoneNumber = body.phoneNumber || existingInteraction?.customer?.phoneNumber || "";
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  await ensureSalesRep(resolveSalesRepId(body, existingInteraction));

  const owner =
    canManageAllCrmRecords(user) && body.owner && mongoose.Types.ObjectId.isValid(body.owner)
      ? body.owner
      : existingInteraction?.owner || user._id;

  const existingCustomer = existingInteraction?.customer || {};
  const existingRequestQty = existingInteraction?.requestQuantity;

  return {
    direction: body.direction ?? existingInteraction?.direction,
    category: body.category ?? existingInteraction?.category,
    customer: {
      organizationType:
        body.organizationType ?? existingCustomer.organizationType ?? "school",
      schoolName: capitalizeWords(body.schoolName || existingCustomer.schoolName || ""),
      address: capitalizeWords(body.address || existingCustomer.address || ""),
      state: body.state || existingCustomer.state || undefined,
      phoneNumber: phoneNumber.trim(),
      normalizedPhoneNumber,
    },
    dateOfContact: body.dateOfContact || existingInteraction?.dateOfContact || new Date(),
    medium: body.medium ?? existingInteraction?.medium,
    customerType: body.customerType ?? existingInteraction?.customerType,
    callerStatus: body.callerStatus ?? existingInteraction?.callerStatus,
    complaintNature: capitalizeWords(body.complaintNature || existingInteraction?.complaintNature || ""),
    bookTitles: capitalizeWords(body.bookTitles || existingInteraction?.bookTitles || ""),
    requestQuantity:
      body.requestQuantity === null || body.requestQuantity === undefined || body.requestQuantity === ""
        ? (existingRequestQty ?? null)
        : Number(body.requestQuantity),
    status: body.status ?? existingInteraction?.status,
    remark: (body.remark || existingInteraction?.remark || "").trim(),
    salesRep: resolveSalesRepId(body, existingInteraction),
    owner,
    createdBy: existingInteraction?.createdBy || user._id,
    updatedBy: user._id,
    phoneLineLabel: body.phoneLineLabel ?? existingInteraction?.phoneLineLabel ?? "",
    csrPhoneNumber: (body.csrPhoneNumber || existingInteraction?.csrPhoneNumber || "").trim(),
    callReference: (body.callReference || existingInteraction?.callReference || "").trim(),
  };
};

const buildSalesRecordPayload = (body, user) => ({
  organizationType: body.organizationType || "school",
  schoolName: capitalizeWords(body.schoolName || ""),
  location: capitalizeWords(body.location || ""),
  ...buildSalesRecordBookPayload(body),
  bookClass: body.bookClass || body.bookItems?.[0]?.bookClass,
  saleDate: body.saleDate || new Date(),
  owner: user._id,
  createdBy: user._id,
  updatedBy: user._id,
});

const findScopedInteraction = async (interactionId, user) => {
  if (!mongoose.Types.ObjectId.isValid(interactionId)) {
    return null;
  }

  return CrmInteraction.findOne({
    _id: interactionId,
    ...buildInteractionAccessFilter(user),
  }).populate("owner", CSR_USER_FIELDS).populate("salesRep", "name state location");
};

const listInteractions = asyncHandler(async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const filter = buildInteractionFilter(req.query, req.user);

  const [interactions, total] = await Promise.all([
    CrmInteraction.find(filter)
      .populate("owner", CSR_USER_FIELDS)
      .populate("salesRep", "name state location")
      .sort({ dateOfContact: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CrmInteraction.countDocuments(filter),
  ]);

  res.json({
    interactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const getInteraction = asyncHandler(async (req, res) => {
  const interaction = await findScopedInteraction(req.params.id, req.user);

  if (!interaction) {
    res.status(404);
    throw new Error("CRM interaction not found");
  }

  res.json({ interaction });
});

const createInteraction = asyncHandler(async (req, res) => {
  const payload = await buildInteractionPayload(req.body, req.user);
  const interaction = await CrmInteraction.create(payload);
  const populated = await CrmInteraction.findById(interaction._id)
    .populate("owner", CSR_USER_FIELDS)
    .populate("salesRep", "name state location");

  res.status(201).json({ interaction: populated });
});

const updateInteraction = asyncHandler(async (req, res) => {
  const interaction = await CrmInteraction.findOne({
    _id: req.params.id,
    ...buildInteractionAccessFilter(req.user),
  });

  if (!interaction) {
    res.status(404);
    throw new Error("CRM interaction not found");
  }

  const payload = await buildInteractionPayload(req.body, req.user, interaction);
  Object.assign(interaction, payload);
  await interaction.save();

  const populated = await CrmInteraction.findById(interaction._id)
    .populate("owner", CSR_USER_FIELDS)
    .populate("salesRep", "name state location");

  res.json({ interaction: populated });
});

const listCustomers = asyncHandler(async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const match = buildInteractionFilter(req.query, req.user);
  delete match.direction;
  delete match.category;
  delete match.status;

  const [summary] = await CrmInteraction.aggregate([
    { $match: match },
    { $sort: { dateOfContact: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$customer.normalizedPhoneNumber",
        schoolName: { $first: "$customer.schoolName" },
        organizationType: { $first: "$customer.organizationType" },
        address: { $first: "$customer.address" },
        state: { $first: "$customer.state" },
        phoneNumber: { $first: "$customer.phoneNumber" },
        customerType: { $first: "$customerType" },
        callerStatus: { $first: "$callerStatus" },
        lastContactDate: { $first: "$dateOfContact" },
        lastDirection: { $first: "$direction" },
        lastCategory: { $first: "$category" },
        totalInteractions: { $sum: 1 },
        unresolvedCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "unresolved"] }, 1, 0],
          },
        },
      },
    },
    { $sort: { lastContactDate: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const customers = summary?.data || [];
  const total = summary?.totalCount?.[0]?.count || 0;

  res.json({
    customers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const getCustomerLookup = asyncHandler(async (req, res) => {
  const normalizedPhoneNumber = normalizePhoneNumber(req.query.phoneNumber || "");

  if (!normalizedPhoneNumber) {
    res.status(400);
    throw new Error("phoneNumber query parameter is required");
  }

  const filter = {
    "customer.normalizedPhoneNumber": normalizedPhoneNumber,
    ...buildInteractionAccessFilter(req.user),
  };

  const [latestInteraction, interactionCount] = await Promise.all([
    CrmInteraction.findOne(filter)
      .populate("owner", CSR_USER_FIELDS)
      .populate("salesRep", "name state location")
      .sort({ dateOfContact: -1, createdAt: -1 }),
    CrmInteraction.countDocuments(filter),
  ]);

  if (!latestInteraction) {
    return res.json({
      customer: null,
      interactionCount: 0,
    });
  }

  res.json({
    customer: {
      organizationType: latestInteraction.customer.organizationType || "school",
      schoolName: latestInteraction.customer.schoolName,
      address: latestInteraction.customer.address,
      state: latestInteraction.customer.state,
      phoneNumber: latestInteraction.customer.phoneNumber,
      customerType: latestInteraction.customerType,
      callerStatus: interactionCount > 1 ? "repeatCaller" : "firstCaller",
      latestInteraction,
    },
    interactionCount,
  });
});

const getCustomerHistory = asyncHandler(async (req, res) => {
  const normalizedPhoneNumber = normalizePhoneNumber(req.query.phoneNumber || "");

  if (!normalizedPhoneNumber) {
    res.status(400);
    throw new Error("phoneNumber query parameter is required");
  }

  const interactions = await CrmInteraction.find({
    "customer.normalizedPhoneNumber": normalizedPhoneNumber,
  })
    .populate("owner", CSR_USER_FIELDS)
    .populate("salesRep", "name state location")
    .sort({ dateOfContact: -1, createdAt: -1 });

  res.json({ interactions });
});

const buildSalesRepFilter = (query) => {
  const filter = {};

  if (query.state) {
    filter.state = query.state;
  }

  if (query.isActive !== undefined && query.isActive !== "") {
    filter.isActive = query.isActive === "true";
  }

  if (query.search) {
    const search = query.search.trim();
    filter.$or = [
      { name: new RegExp(search, "i") },
      { state: new RegExp(search, "i") },
      { location: new RegExp(search, "i") },
      { phoneNumber: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
    ];
  }

  return filter;
};

const listSalesReps = asyncHandler(async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const filter = buildSalesRepFilter(req.query);

  const [salesReps, total] = await Promise.all([
    SalesRep.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    SalesRep.countDocuments(filter),
  ]);

  res.json({
    salesReps,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const createSalesRep = asyncHandler(async (req, res) => {
  const salesRep = await SalesRep.create({
    name: capitalizeWords(req.body.name || ""),
    state: req.body.state,
    location: (req.body.location || "").trim(),
    phoneNumber: (req.body.phoneNumber || "").trim(),
    email: (req.body.email || "").trim().toLowerCase(),
    isActive: req.body.isActive !== false,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  res.status(201).json({ salesRep });
});

const importSalesReps = asyncHandler(async (req, res) => {
  const salesReps = Array.isArray(req.body.salesReps) ? req.body.salesReps : [];

  if (!salesReps.length) {
    res.status(400);
    throw new Error("Provide at least one sales rep to import");
  }

  const operations = salesReps.map((entry) => ({
    updateOne: {
      filter: {
        name: capitalizeWords(entry.name || ""),
        state: entry.state,
        location: (entry.location || "").trim(),
      },
      update: {
        $set: {
          phoneNumber: (entry.phoneNumber || "").trim(),
          email: (entry.email || "").trim().toLowerCase(),
          isActive: entry.isActive !== false,
          updatedBy: req.user._id,
        },
        $setOnInsert: {
          createdBy: req.user._id,
        },
      },
      upsert: true,
    },
  }));

  await SalesRep.bulkWrite(operations);

  res.status(201).json({ message: "Sales reps imported successfully" });
});

const resolveNigerianState = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = NIGERIAN_STATES.find(
    (state) => state.toLowerCase() === trimmed.toLowerCase()
  );

  return match || null;
};

const buildSchoolLookupFilter = (entry) => {
  const phoneFields = getStoredPhoneFields(entry.phoneNumber);
  const conditions = [
    {
      schoolName: new RegExp(`^${escapeRegex(entry.schoolName)}$`, "i"),
      state: entry.state,
      address: new RegExp(`^${escapeRegex(entry.address || "")}$`, "i"),
    },
  ];

  if (phoneFields.normalizedPhoneNumber) {
    conditions.unshift({ normalizedPhoneNumber: phoneFields.normalizedPhoneNumber });
  }

  return { $or: conditions };
};

const normalizeStoredSchoolPhones = async () => {
  await School.updateMany(
    { normalizedPhoneNumber: { $in: ["", null] } },
    { $unset: { normalizedPhoneNumber: "" } }
  );
};

const dedupeSchoolEntries = (entries) => {
  const seen = new Map();

  entries.forEach((entry, index) => {
    const normalizedPhoneNumber = normalizePhoneNumber(entry.phoneNumber || "");
    const key = normalizedPhoneNumber
      ? `phone:${normalizedPhoneNumber}`
      : `school:${entry.schoolName}|${entry.state}|${entry.address}`.toLowerCase();

    seen.set(key, { entry, index });
  });

  return Array.from(seen.values());
};

const upsertSchoolEntry = async (entry, userId) => {
  const phoneFields = getStoredPhoneFields(entry.phoneNumber);
  const payload = {
    schoolName: entry.schoolName,
    address: entry.address,
    state: entry.state,
    phoneNumber: phoneFields.phoneNumber,
    updatedBy: userId,
  };

  if (phoneFields.normalizedPhoneNumber) {
    payload.normalizedPhoneNumber = phoneFields.normalizedPhoneNumber;
  }

  const applyPhoneFields = (document) => {
    Object.assign(document, payload);

    if (!phoneFields.normalizedPhoneNumber) {
      document.normalizedPhoneNumber = undefined;
    }
  };

  let existing = await School.findOne(buildSchoolLookupFilter(entry));

  if (existing) {
    if (
      phoneFields.normalizedPhoneNumber &&
      existing.normalizedPhoneNumber &&
      existing.normalizedPhoneNumber !== phoneFields.normalizedPhoneNumber
    ) {
      const phoneOwner = await School.findOne({
        normalizedPhoneNumber: phoneFields.normalizedPhoneNumber,
        _id: { $ne: existing._id },
      });

      if (phoneOwner) {
        return { action: "skipped", reason: "Duplicate record skipped (phone already exists)" };
      }
    }

    applyPhoneFields(existing);
    await existing.save();
    return { action: "updated", school: existing };
  }

  if (phoneFields.normalizedPhoneNumber) {
    existing = await School.findOne({
      normalizedPhoneNumber: phoneFields.normalizedPhoneNumber,
    });

    if (existing) {
      applyPhoneFields(existing);
      await existing.save();
      return { action: "updated", school: existing };
    }
  }

  try {
    const school = await School.create({
      ...payload,
      createdBy: userId,
    });
    return { action: "inserted", school };
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    existing =
      (await School.findOne(buildSchoolLookupFilter(entry))) ||
      (phoneFields.normalizedPhoneNumber
        ? await School.findOne({ normalizedPhoneNumber: phoneFields.normalizedPhoneNumber })
        : null);

    if (!existing) {
      return { action: "skipped", reason: "Duplicate record skipped" };
    }

    applyPhoneFields(existing);
    await existing.save();
    return { action: "updated", school: existing };
  }
};

const listSchools = asyncHandler(async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const filter = {};

  if (req.query.state) {
    filter.state = req.query.state;
  }

  if (req.query.search) {
    const search = req.query.search.trim();
    const phoneSearch = normalizePhoneNumber(search);
    const searchPattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { schoolName: searchPattern },
      { address: searchPattern },
      { phoneNumber: searchPattern },
      ...(phoneSearch ? [{ normalizedPhoneNumber: phoneSearch }] : []),
    ];
  }

  const [schools, total] = await Promise.all([
    School.find(filter).sort({ schoolName: 1, createdAt: -1 }).skip(skip).limit(limit),
    School.countDocuments(filter),
  ]);

  console.log("[listSchools]", {
    search: req.query.search || null,
    state: req.query.state || null,
    limit,
    page,
    total,
    returned: schools.length,
    sample: schools.slice(0, 3).map((school) => ({
      id: school._id,
      schoolName: school.schoolName,
      state: school.state,
    })),
  });

  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  res.status(200).json({
    schools,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const createSchool = asyncHandler(async (req, res) => {
  await normalizeStoredSchoolPhones();

  const schoolName = (req.body.schoolName || "").trim();
  const state = resolveNigerianState(req.body.state || "");

  if (!schoolName) {
    res.status(400);
    throw new Error("School name is required");
  }

  if (!state) {
    res.status(400);
    throw new Error("A valid Nigerian state is required");
  }

  const entry = {
    schoolName: capitalizeWords(schoolName),
    address: capitalizeWords(req.body.address || ""),
    state,
    phoneNumber: (req.body.phoneNumber || "").trim(),
  };

  const result = await upsertSchoolEntry(entry, req.user._id);

  console.log("[createSchool]", {
    requested: entry,
    action: result.action,
    schoolId: result.school?._id,
    schoolName: result.school?.schoolName,
    state: result.school?.state,
    skippedReason: result.reason || null,
  });

  if (result.action === "skipped") {
    res.status(409);
    throw new Error(result.reason || "Could not add school");
  }

  const school = result.school || (await School.findOne(buildSchoolLookupFilter(entry)));

  if (!school) {
    res.status(500);
    throw new Error("School was saved but could not be loaded");
  }

  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  res.status(result.action === "inserted" ? 201 : 200).json({
    school,
    action: result.action,
    message:
      result.action === "inserted"
        ? "School added to the directory"
        : "Existing school record updated",
  });
});

const importSchools = asyncHandler(async (req, res) => {
  await normalizeStoredSchoolPhones();

  const schools = Array.isArray(req.body.schools) ? req.body.schools : [];

  if (!schools.length) {
    res.status(400);
    throw new Error("Provide at least one school to import");
  }

  const validEntries = [];
  const skipped = [];

  schools.forEach((entry, index) => {
    const schoolName = (entry.schoolName || "").trim();
    const state = resolveNigerianState(entry.state || "");

    if (!schoolName || !state) {
      skipped.push({
        row: index + 1,
        reason: !schoolName ? "Missing school name" : "Invalid or missing state",
      });
      return;
    }

    const phoneNumber = (entry.phoneNumber || "").trim();
    const phoneFields = getStoredPhoneFields(phoneNumber);

    validEntries.push({
      schoolName: capitalizeWords(schoolName),
      address: capitalizeWords(entry.address || ""),
      state,
      phoneNumber: phoneFields.phoneNumber,
      normalizedPhoneNumber: phoneFields.normalizedPhoneNumber,
      sourceRow: index + 1,
    });
  });

  if (!validEntries.length) {
    res.status(400);
    throw new Error("No valid school records were found to import");
  }

  const dedupedEntries = dedupeSchoolEntries(validEntries);
  const duplicateRowsSkipped = validEntries.length - dedupedEntries.length;

  let inserted = 0;
  let updated = 0;

  for (const { entry, index } of dedupedEntries) {
    try {
      const result = await upsertSchoolEntry(entry, req.user._id);

      if (result.action === "inserted") {
        inserted += 1;
      } else if (result.action === "updated") {
        updated += 1;
      } else {
        skipped.push({
          row: entry.sourceRow || index + 1,
          reason: result.reason || "Duplicate record skipped",
        });
      }
    } catch (error) {
      skipped.push({
        row: entry.sourceRow || index + 1,
        reason: error.message || "Failed to import row",
      });
    }
  }

  if (duplicateRowsSkipped > 0) {
    skipped.push({
      row: null,
      reason: `${duplicateRowsSkipped} duplicate row(s) in this batch were skipped`,
    });
  }

  res.status(201).json({
    message: "School import batch completed",
    imported: inserted + updated,
    inserted,
    updated,
    skipped,
  });
});

const updateSalesRep = asyncHandler(async (req, res) => {
  const salesRep = await SalesRep.findById(req.params.id);

  if (!salesRep) {
    res.status(404);
    throw new Error("Sales rep not found");
  }

  if (req.body.name !== undefined) {
    salesRep.name = capitalizeWords(req.body.name);
  }
  if (req.body.state !== undefined) {
    salesRep.state = req.body.state;
  }
  if (req.body.location !== undefined) {
    salesRep.location = req.body.location.trim();
  }
  if (req.body.phoneNumber !== undefined) {
    salesRep.phoneNumber = req.body.phoneNumber.trim();
  }
  if (req.body.email !== undefined) {
    salesRep.email = req.body.email.trim().toLowerCase();
  }
  if (req.body.isActive !== undefined) {
    salesRep.isActive = Boolean(req.body.isActive);
  }

  salesRep.updatedBy = req.user._id;
  await salesRep.save();

  res.json({ salesRep });
});

const deleteSalesRep = asyncHandler(async (req, res) => {
  const salesRep = await SalesRep.findById(req.params.id);

  if (!salesRep) {
    res.status(404);
    throw new Error("Sales rep not found");
  }

  await salesRep.deleteOne();
  res.json({ message: "Sales rep deleted successfully" });
});

const listSalesRecords = asyncHandler(async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const dateRange = parseDashboardDateRange(req.query);
  const filter = buildSalesRecordFilter(req.query, req.user);

  const [records, total, totals] = await Promise.all([
    CrmSalesRecord.find(filter)
      .populate("owner", CSR_USER_FIELDS)
      .sort({ saleDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CrmSalesRecord.countDocuments(filter),
    CrmSalesRecord.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuantitySold: { $sum: "$quantitySold" },
          totalSalesValue: { $sum: "$totalPrice" },
        },
      },
    ]),
  ]);

  res.json({
    records,
    summary: {
      totalRecords: total,
      totalQuantitySold: totals[0]?.totalQuantitySold || 0,
      totalSalesValue: totals[0]?.totalSalesValue || 0,
    },
    period: dateRange
      ? {
          type: dateRange.period,
          startDate: formatDateOnly(dateRange.startDate),
          endDate: formatDateOnly(dateRange.endDate),
        }
      : { type: "all" },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const createSalesRecord = asyncHandler(async (req, res) => {
  const payload = buildSalesRecordPayload(req.body, req.user);
  const record = await CrmSalesRecord.create(payload);
  const populated = await CrmSalesRecord.findById(record._id).populate(
    "owner",
    CSR_USER_FIELDS
  );

  res.status(201).json({ record: populated });
});

const buildSurveyUrl = (token) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `${clientUrl}/crm/surveys/respond/${token}`;
};

const resolveSurveyCustomerName = (interaction, customerPhoneNumber = "", manualName = "") => {
  const providedName = (manualName || "").trim();

  if (providedName) {
    return providedName;
  }

  const schoolName = (interaction.customer?.schoolName || "").trim();

  if (schoolName) {
    return schoolName;
  }

  const phoneNumber = (
    customerPhoneNumber ||
    interaction.customer?.phoneNumber ||
    ""
  ).trim();

  if (phoneNumber) {
    return phoneNumber;
  }

  return "Customer";
};

const createSurveyDispatch = asyncHandler(async (req, res) => {
  const interaction = await CrmInteraction.findOne({
    _id: req.body.interactionId,
    ...buildInteractionAccessFilter(req.user),
  }).populate("owner", CSR_USER_FIELDS);

  if (!interaction) {
    res.status(404);
    throw new Error("CRM interaction not found");
  }

  const channel = req.body.channel;
  const manualCustomerName = (req.body.customerName || "").trim();
  const customerEmail =
    channel === "Email" ? (req.body.customerEmail || "").trim().toLowerCase() : "";
  const customerPhoneNumber =
    channel === "WhatsApp" || channel === "SMS" || channel === "Manual"
      ? (req.body.customerPhoneNumber || "").trim() || interaction.customer.phoneNumber
      : interaction.customer.phoneNumber;

  if (!manualCustomerName) {
    res.status(400);
    throw new Error("Customer name is required when triggering a survey");
  }

  if (channel === "Email" && !customerEmail) {
    res.status(400);
    throw new Error("Customer email is required when sending a survey by email");
  }

  if ((channel === "WhatsApp" || channel === "SMS") && !customerPhoneNumber) {
    res.status(400);
    throw new Error("Customer phone number is required for WhatsApp and SMS survey sends");
  }

  const token = crypto.randomBytes(18).toString("hex");
  const customerName = resolveSurveyCustomerName(
    interaction,
    customerPhoneNumber,
    manualCustomerName
  );
  const dispatch = await SurveyDispatch.create({
    interaction: interaction._id,
    customerName,
    customerPhoneNumber,
    customerEmail,
    channel,
    message: (req.body.message || "").trim(),
    token,
    surveyUrl: buildSurveyUrl(token),
    status: channel === "Email" || channel === "SMS" ? "pending" : "sent",
    sentBy: req.user._id,
  });

  let emailDelivery = {
    sent: false,
  };
  let smsDelivery = {
    sent: false,
  };

  if (channel === "Email") {
    try {
      const emailResult = await sendSurveyEmail({ dispatch, interaction });
      dispatch.status = "sent";
      dispatch.sentAt = new Date();
      await dispatch.save();
      emailDelivery = {
        messageId: emailResult.messageId,
        sent: true,
      };
    } catch (error) {
      error.statusCode = error.statusCode || 502;
      error.message = `Failed to send survey email: ${error.message}`;
      throw error;
    }
  }

  if (channel === "SMS") {
    try {
      const smsResult = await sendSurveySms({ dispatch });
      dispatch.status = "sent";
      dispatch.sentAt = new Date();
      await dispatch.save();
      smsDelivery = {
        messageId: smsResult.messageId,
        sent: true,
      };
    } catch (error) {
      console.error("[crm] Survey SMS send failed", {
        dispatchId: dispatch._id?.toString(),
        phoneNumber: customerPhoneNumber,
        message: error.message,
      });
      error.statusCode = error.statusCode || 502;
      error.message = `Failed to send survey SMS: ${error.message}`;
      throw error;
    }
  }

  const populated = await SurveyDispatch.findById(dispatch._id)
    .populate({
      path: "interaction",
      populate: { path: "owner", select: CSR_USER_FIELDS },
    })
    .populate("sentBy", CSR_USER_FIELDS);

  res.status(201).json({ dispatch: populated, email: emailDelivery, sms: smsDelivery });
});

const listSurveyDispatches = asyncHandler(async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const interactionFilter = buildInteractionAccessFilter(req.user);

  const interactionIds = await CrmInteraction.find(interactionFilter).distinct("_id");
  const filter = { interaction: { $in: interactionIds } };

  if (req.query.channel) {
    filter.channel = req.query.channel;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.interactionId) {
    if (!interactionIds.some((id) => id.toString() === req.query.interactionId)) {
      return res.json({
        dispatches: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 1,
        },
      });
    }

    filter.interaction = req.query.interactionId;
  }

  if (req.query.search) {
    const search = req.query.search.trim();
    filter.$or = [
      { customerName: new RegExp(search, "i") },
      { customerPhoneNumber: new RegExp(search, "i") },
      { customerEmail: new RegExp(search, "i") },
    ];
  }

  const [dispatches, total] = await Promise.all([
    SurveyDispatch.find(filter)
      .populate({
        path: "interaction",
        populate: { path: "owner", select: CSR_USER_FIELDS },
      })
      .populate("sentBy", CSR_USER_FIELDS)
      .sort({ sentAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SurveyDispatch.countDocuments(filter),
  ]);

  res.json({
    dispatches,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const listSurveyResponses = asyncHandler(async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const baseFilter = {
    status: "responded",
    "response.respondedAt": { $exists: true },
  };
  const filter = { ...baseFilter };

  if (req.query.search) {
    const search = req.query.search.trim();
    filter.$or = [
      { customerName: new RegExp(search, "i") },
      { customerPhoneNumber: new RegExp(search, "i") },
      { customerEmail: new RegExp(search, "i") },
      { "response.feedback": new RegExp(search, "i") },
    ];
  }

  const [responses, total, summaryRows] = await Promise.all([
    SurveyDispatch.find(filter)
      .populate({
        path: "interaction",
        populate: [
          { path: "owner", select: CSR_USER_FIELDS },
          { path: "salesRep", select: "name state location" },
        ],
      })
      .populate("sentBy", CSR_USER_FIELDS)
      .sort({ "response.respondedAt": -1 })
      .skip(skip)
      .limit(limit),
    SurveyDispatch.countDocuments(filter),
    SurveyDispatch.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgService: { $avg: "$response.serviceRating" },
          avgMarketer: { $avg: "$response.marketerRating" },
          avgCsr: { $avg: "$response.csrRating" },
          avgResolution: { $avg: "$response.resolutionRating" },
          avgRecommend: { $avg: "$response.recommendRating" },
        },
      },
    ]),
  ]);

  const summary = summaryRows[0] || {
    total: 0,
    avgService: 0,
    avgMarketer: 0,
    avgCsr: 0,
    avgResolution: 0,
    avgRecommend: 0,
  };

  res.json({
    responses,
    summary: {
      total: summary.total,
      avgService: Number(summary.avgService?.toFixed(1) || 0),
      avgMarketer: Number(summary.avgMarketer?.toFixed(1) || 0),
      avgCsr: Number(summary.avgCsr?.toFixed(1) || 0),
      avgResolution: Number(summary.avgResolution?.toFixed(1) || 0),
      avgRecommend: Number(summary.avgRecommend?.toFixed(1) || 0),
    },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

const getPublicSurvey = asyncHandler(async (req, res) => {
  const dispatch = await SurveyDispatch.findOne({ token: req.params.token }).populate({
    path: "interaction",
    populate: [
      { path: "owner", select: "name csrDisplayName" },
      { path: "salesRep", select: "name" },
    ],
  });

  if (!dispatch) {
    res.status(404);
    throw new Error("Survey not found");
  }

  const marketerName = dispatch.interaction?.salesRep?.name;
  const csrName = getCsrDisplayName(dispatch.interaction?.owner);
  const marketerLabel = marketerName
    ? `How would you rate the marketer (${marketerName}) who attended to you?`
    : "How would you rate the marketer who attended to you?";
  const csrLabel = csrName
    ? `How would you rate the CSR (${csrName}) who handled your call?`
    : "How would you rate the CSR who handled your call?";

  res.json({
    survey: {
      customerName: dispatch.customerName,
      schoolName: dispatch.interaction?.customer?.schoolName || dispatch.customerName,
      marketerName: marketerName || null,
      csrName: csrName || null,
      status: dispatch.status,
      responded: Boolean(dispatch.response?.respondedAt),
      questions: [
        "How satisfied were you with our service?",
        marketerLabel,
        csrLabel,
        "How satisfied are you with the resolution provided?",
        "How likely are you to recommend Accessible Publishers Ltd?",
      ],
    },
  });
});

const submitPublicSurveyResponse = asyncHandler(async (req, res) => {
  const dispatch = await SurveyDispatch.findOne({ token: req.params.token });

  if (!dispatch) {
    res.status(404);
    throw new Error("Survey not found");
  }

  dispatch.response = {
    serviceRating: Number(req.body.serviceRating),
    marketerRating: Number(req.body.marketerRating),
    csrRating: Number(req.body.csrRating),
    resolutionRating: Number(req.body.resolutionRating),
    recommendRating: Number(req.body.recommendRating),
    feedback: (req.body.feedback || "").trim(),
    respondedAt: new Date(),
  };
  dispatch.status = "responded";
  await dispatch.save();

  res.json({ message: "Survey submitted successfully" });
});

const getDashboardSummary = asyncHandler(async (req, res) => {
  const dateRange = parseDashboardDateRange(req.query);
  const accessFilter = buildInteractionAccessFilter(req.user);
  const filter = applyDateRange(accessFilter, "dateOfContact", dateRange);
  const salesRecordFilter = applyDateRange(
    buildSalesRecordAccessFilter(req.user),
    "saleDate",
    dateRange
  );
  const interactionIds = await CrmInteraction.find(accessFilter).distinct("_id");
  const surveyFilter = {
    interaction: { $in: interactionIds },
  };

  if (dateRange) {
    surveyFilter.createdAt = {
      $gte: dateRange.startDate,
      $lte: dateRange.endDate,
    };
  }

  const [
    totalContacts,
    inboundCount,
    outboundCount,
    unresolvedCount,
    pendingRequests,
    surveysSent,
    totalSalesRecords,
    salesRecordTotals,
  ] = await Promise.all([
    CrmInteraction.countDocuments(filter),
    CrmInteraction.countDocuments({ ...filter, direction: "inbound" }),
    CrmInteraction.countDocuments({ ...filter, direction: "outbound" }),
    CrmInteraction.countDocuments({ ...filter, status: "unresolved" }),
    CrmInteraction.countDocuments({
      ...filter,
      category: "request",
      status: "unresolved",
    }),
    SurveyDispatch.countDocuments(surveyFilter),
    CrmSalesRecord.countDocuments(salesRecordFilter),
    CrmSalesRecord.aggregate([
      { $match: salesRecordFilter },
      {
        $group: {
          _id: null,
          totalBooksSold: { $sum: "$quantitySold" },
          totalSalesValue: { $sum: "$totalPrice" },
        },
      },
    ]),
  ]);

  const recentInteractions = await CrmInteraction.find(filter)
    .populate("owner", CSR_USER_FIELDS)
    .populate("salesRep", "name state location")
    .sort({ dateOfContact: -1, createdAt: -1 })
    .limit(5);

  res.json({
    summary: {
      totalContacts,
      inboundCount,
      outboundCount,
      unresolvedCount,
      pendingRequests,
      surveysSent,
      totalSalesRecords,
      totalBooksSold: salesRecordTotals[0]?.totalBooksSold || 0,
      totalSalesValue: salesRecordTotals[0]?.totalSalesValue || 0,
    },
    period: dateRange
      ? {
          type: dateRange.period,
          startDate: formatDateOnly(dateRange.startDate),
          endDate: formatDateOnly(dateRange.endDate),
        }
      : { type: "all" },
    recentInteractions,
  });
});

const getReportsSummary = asyncHandler(async (req, res) => {
  const filter = buildInteractionAccessFilter(req.user);
  const interactionIds = await CrmInteraction.find(filter).distinct("_id");

  const [byDirection, byCategory, byState, byOwner, bySalesRep, surveys] = await Promise.all([
    CrmInteraction.aggregate([
      { $match: filter },
      { $group: { _id: "$direction", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    CrmInteraction.aggregate([
      { $match: filter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    CrmInteraction.aggregate([
      { $match: filter },
      { $group: { _id: "$customer.state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    CrmInteraction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$owner",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $project: {
          count: 1,
          name: {
            $ifNull: [
              { $arrayElemAt: ["$owner.csrDisplayName", 0] },
              { $ifNull: [{ $arrayElemAt: ["$owner.name", 0] }, "Unknown CSR"] },
            ],
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
    CrmInteraction.aggregate([
      { $match: { ...filter, salesRep: { $ne: null } } },
      {
        $group: {
          _id: "$salesRep",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "salesreps",
          localField: "_id",
          foreignField: "_id",
          as: "salesRep",
        },
      },
      {
        $project: {
          count: 1,
          name: {
            $ifNull: [{ $arrayElemAt: ["$salesRep.name", 0] }, "Unassigned sales rep"],
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
    SurveyDispatch.aggregate([
      { $match: { interaction: { $in: interactionIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const [surveyBySender, surveyByTicketOwner] = await Promise.all([
    SurveyDispatch.aggregate([
      { $match: { interaction: { $in: interactionIds } } },
      {
        $group: {
          _id: "$sentBy",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "sender",
        },
      },
      {
        $project: {
          count: 1,
          name: {
            $ifNull: [
              { $arrayElemAt: ["$sender.csrDisplayName", 0] },
              { $ifNull: [{ $arrayElemAt: ["$sender.name", 0] }, "Unknown sender"] },
            ],
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
    SurveyDispatch.aggregate([
      { $match: { interaction: { $in: interactionIds } } },
      {
        $lookup: {
          from: "crminteractions",
          localField: "interaction",
          foreignField: "_id",
          as: "interaction",
        },
      },
      { $unwind: "$interaction" },
      {
        $group: {
          _id: "$interaction.owner",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $project: {
          count: 1,
          name: {
            $ifNull: [
              { $arrayElemAt: ["$owner.csrDisplayName", 0] },
              { $ifNull: [{ $arrayElemAt: ["$owner.name", 0] }, "Unknown CSR"] },
            ],
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  const surveySent = surveys.reduce((sum, item) => sum + item.count, 0);
  const surveyResponded =
    surveys.find((item) => item._id === "responded")?.count || 0;

  res.json({
    reports: {
      byDirection,
      byCategory,
      byState,
      byOwner,
      bySalesRep,
      surveyBySender,
      surveyByTicketOwner,
      surveySent,
      surveyResponded,
      surveyResponseRate: surveySent ? Math.round((surveyResponded / surveySent) * 100) : 0,
    },
  });
});

module.exports = {
  createInteraction,
  createSalesRecord,
  createSalesRep,
  createSchool,
  createSurveyDispatch,
  deleteSalesRep,
  getCustomerHistory,
  getCustomerLookup,
  getDashboardSummary,
  getInteraction,
  getPublicSurvey,
  getReportsSummary,
  importSalesReps,
  importSchools,
  listCustomers,
  listInteractions,
  listSalesRecords,
  listSalesReps,
  listSchools,
  listSurveyDispatches,
  listSurveyResponses,
  submitPublicSurveyResponse,
  updateInteraction,
  updateSalesRep,
};
