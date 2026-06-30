const crypto = require("crypto");
const mongoose = require("mongoose");

const CrmInteraction = require("../models/CrmInteraction");
const CrmSalesRecord = require("../models/CrmSalesRecord");
const SalesRep = require("../models/SalesRep");
const SurveyDispatch = require("../models/SurveyDispatch");
const asyncHandler = require("../utils/asyncHandler");
const { sendSurveyEmail } = require("../mailtrap/email");

const normalizePhoneNumber = (value = "") => value.replace(/\D/g, "");

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
  const filter = { ...buildSalesRecordAccessFilter(user) };
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

const buildSalesRecordBookPayload = (body) => {
  const submittedItems = Array.isArray(body.bookItems) ? body.bookItems : [];
  const bookItems = submittedItems
    .map((item) => ({
      title: capitalizeWords(item.title || ""),
      bookClass: item.bookClass || body.bookClass,
      price: roundMoney(item.price),
    }))
    .filter((item) => item.title);

  const fallbackTitles = capitalizeWords(body.bookTitles || "");
  const bookTitles = bookItems.length
    ? bookItems.map((item) => item.title).join(", ")
    : fallbackTitles;
  const subtotalPrice = roundMoney(
    bookItems.reduce((total, item) => total + item.price, 0)
  );
  const discountPercent = Math.min(
    100,
    Math.max(0, roundMoney(body.discountPercent))
  );
  const discountAmount = roundMoney((subtotalPrice * discountPercent) / 100);
  const totalPrice = roundMoney(Math.max(0, subtotalPrice - discountAmount));

  return {
    bookTitles,
    bookItems,
    quantitySold: bookItems.length || Number(body.quantitySold),
    subtotalPrice,
    discountPercent,
    discountAmount,
    totalPrice,
  };
};

const buildInteractionPayload = async (body, user, existingInteraction = null) => {
  const phoneNumber = body.phoneNumber || existingInteraction?.customer?.phoneNumber || "";
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    const error = new Error("Phone number is required");
    error.statusCode = 400;
    throw error;
  }

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
      state: body.state ?? existingCustomer.state,
      phoneNumber: phoneNumber.trim(),
      normalizedPhoneNumber,
    },
    dateOfContact: body.dateOfContact ?? existingInteraction?.dateOfContact,
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
    remark: capitalizeWords(body.remark || existingInteraction?.remark || ""),
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
  }).populate("owner", "name staffId role").populate("salesRep", "name state location");
};

const listInteractions = asyncHandler(async (req, res) => {
  const { limit, page, skip } = parsePagination(req.query);
  const filter = buildInteractionFilter(req.query, req.user);

  const [interactions, total] = await Promise.all([
    CrmInteraction.find(filter)
      .populate("owner", "name staffId role")
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
    .populate("owner", "name staffId role")
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
    .populate("owner", "name staffId role")
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
      .populate("owner", "name staffId role")
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
    .populate("owner", "name staffId role")
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
  const filter = buildSalesRecordFilter(req.query, req.user);

  const [records, total, totals] = await Promise.all([
    CrmSalesRecord.find(filter)
      .populate("owner", "name staffId role")
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
    "name staffId role"
  );

  res.status(201).json({ record: populated });
});

const buildSurveyUrl = (token) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `${clientUrl}/crm/surveys/respond/${token}`;
};

const createSurveyDispatch = asyncHandler(async (req, res) => {
  const interaction = await CrmInteraction.findOne({
    _id: req.body.interactionId,
    ...buildInteractionAccessFilter(req.user),
  }).populate("owner", "name staffId role");

  if (!interaction) {
    res.status(404);
    throw new Error("CRM interaction not found");
  }

  const channel = req.body.channel;
  const customerEmail =
    channel === "Email" ? (req.body.customerEmail || "").trim().toLowerCase() : "";
  const customerPhoneNumber =
    channel === "WhatsApp" || channel === "SMS"
      ? (req.body.customerPhoneNumber || "").trim()
      : interaction.customer.phoneNumber;

  if (channel === "Email" && !customerEmail) {
    res.status(400);
    throw new Error("Customer email is required when sending a survey by email");
  }

  if ((channel === "WhatsApp" || channel === "SMS") && !customerPhoneNumber) {
    res.status(400);
    throw new Error("Customer phone number is required for WhatsApp and SMS survey sends");
  }

  const token = crypto.randomBytes(18).toString("hex");
  const dispatch = await SurveyDispatch.create({
    interaction: interaction._id,
    customerName: interaction.customer.schoolName,
    customerPhoneNumber,
    customerEmail,
    channel,
    message: (req.body.message || "").trim(),
    token,
    surveyUrl: buildSurveyUrl(token),
    status: channel === "Email" ? "pending" : "sent",
    sentBy: req.user._id,
  });

  let emailDelivery = {
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

  const populated = await SurveyDispatch.findById(dispatch._id)
    .populate({
      path: "interaction",
      populate: { path: "owner", select: "name staffId role" },
    })
    .populate("sentBy", "name staffId role");

  res.status(201).json({ dispatch: populated, email: emailDelivery });
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
        populate: { path: "owner", select: "name staffId role" },
      })
      .populate("sentBy", "name staffId role")
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
          { path: "owner", select: "name staffId role" },
          { path: "salesRep", select: "name state location" },
        ],
      })
      .populate("sentBy", "name staffId role")
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
      { path: "owner", select: "name" },
      { path: "salesRep", select: "name" },
    ],
  });

  if (!dispatch) {
    res.status(404);
    throw new Error("Survey not found");
  }

  const marketerName = dispatch.interaction?.salesRep?.name;
  const csrName = dispatch.interaction?.owner?.name;
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
  const filter = buildInteractionAccessFilter(req.user);
  const salesRecordFilter = buildSalesRecordAccessFilter(req.user);
  const interactionIds = await CrmInteraction.find(filter).distinct("_id");
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
    SurveyDispatch.countDocuments({
      interaction: { $in: interactionIds },
    }),
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
    .populate("owner", "name staffId role")
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
          name: { $ifNull: [{ $arrayElemAt: ["$owner.name", 0] }, "Unknown CSR"] },
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
          name: { $ifNull: [{ $arrayElemAt: ["$sender.name", 0] }, "Unknown sender"] },
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
          name: { $ifNull: [{ $arrayElemAt: ["$owner.name", 0] }, "Unknown CSR"] },
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
  createSurveyDispatch,
  deleteSalesRep,
  getCustomerHistory,
  getCustomerLookup,
  getDashboardSummary,
  getInteraction,
  getPublicSurvey,
  getReportsSummary,
  importSalesReps,
  listCustomers,
  listInteractions,
  listSalesRecords,
  listSalesReps,
  listSurveyDispatches,
  listSurveyResponses,
  submitPublicSurveyResponse,
  updateInteraction,
  updateSalesRep,
};
