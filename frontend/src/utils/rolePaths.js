export const getPanelBasePath = (role) => {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "hr") {
    return "/hr";
  }

  if (role === "csr" || role === "csrAdmin") {
    return "/csr";
  }

  return null;
};

export const getDashboardPath = (role) => {
  const panelPath = getPanelBasePath(role);

  if (panelPath) {
    return panelPath;
  }

  if (role === "staff") {
    return "/dashboard";
  }

  return "/";
};

export const panelSegmentPath = (role, segment) => {
  const base = getPanelBasePath(role);

  if (!base) {
    return "/";
  }

  return segment ? `${base}/${segment}` : base;
};

export const getResultsPath = (role) => {
  if (role === "staff") {
    return "/dashboard/results";
  }

  if (role === "csr" || role === "csrAdmin") {
    return "/csr";
  }

  return panelSegmentPath(role, "results");
};
