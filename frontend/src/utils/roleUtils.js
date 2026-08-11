export function getRoleNames(user) {
  if (!user) return [];
  const roles = [];

  if (Array.isArray(user.roles)) {
    user.roles.forEach((r) => {
      if (typeof r === "string") roles.push(r);
      else if (r?.role?.name) roles.push(r.role.name);
      else if (r?.name) roles.push(r.name);
    });
  }

  if (user.role) {
    if (typeof user.role === "string") roles.push(user.role);
    else if (user.role?.name) roles.push(user.role.name);
  }

  return roles;
}

export function isSuperAdminUser(user) {
  const roles = getRoleNames(user).map((r) => r.toLowerCase());
  return roles.some(
    (r) =>
      r.includes("super admin") ||
      r.includes("super_admin") ||
      r === "superadmin" ||
      r === "super"
  );
}

export function isCompanyAdminUser(user) {
  const roles = getRoleNames(user).map((r) => r.toLowerCase());
  return roles.some(
    (r) =>
      (r.includes("company admin") ||
        r.includes("organization admin") ||
        r.includes("company_admin")) &&
      !r.includes("super")
  );
}

export function isHeadOfSalesUser(user) {
  const roles = getRoleNames(user).map((r) => r.toLowerCase());
  return roles.some((r) => r.includes("head of sales"));
}

export function isSalesManagerUser(user) {
  const roles = getRoleNames(user).map((r) => r.toLowerCase());
  return roles.some(
    (r) =>
      (r.includes("sales manager") ||
        r.includes("sales_manager") ||
        r.includes("sales lead")) &&
      !r.includes("head of sales")
  );
}

export function isSalesExecutiveUser(user) {
  const roles = getRoleNames(user).map((r) => r.toLowerCase());
  return roles.some(
    (r) =>
      r.includes("sales executive") ||
      r.includes("field executive") ||
      r.includes("sales_executive")
  );
}

export function isInventoryManagerUser(user) {
  const roles = getRoleNames(user).map((r) => r.toLowerCase());
  return roles.some(
    (r) =>
      r.includes("inventory manager") ||
      r.includes("inventory_manager")
  );
}

export function isWarehouseManagerUser(user) {
  const roles = getRoleNames(user).map((r) => r.toLowerCase());
  return roles.some(
    (r) =>
      r.includes("warehouse manager") ||
      r.includes("warehouse_manager")
  );
}
