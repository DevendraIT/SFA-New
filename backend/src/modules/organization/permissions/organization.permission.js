export const ORGANIZATION_PERMISSIONS = Object.freeze({

    // ---------------------------------------------------------------------
    // Organization
    // ---------------------------------------------------------------------

    READ_ORGANIZATION: "organization:read",
    CREATE_ORGANIZATION: "organization:create",
    UPDATE_ORGANIZATION: "organization:update",
    DELETE_ORGANIZATION: "organization:delete",

    // ---------------------------------------------------------------------
    // Branch
    // ---------------------------------------------------------------------

    CREATE_BRANCH: "branch:create",
    READ_BRANCHES: "branch:read",
    UPDATE_BRANCH: "branch:update",
    DELETE_BRANCH: "branch:delete",

    // ---------------------------------------------------------------------
    // Department
    // ---------------------------------------------------------------------

    CREATE_DEPARTMENT: "department:create",
    READ_DEPARTMENTS: "department:read",
    UPDATE_DEPARTMENT: "department:update",
    DELETE_DEPARTMENT: "department:delete",

    // ---------------------------------------------------------------------
    // Territory
    // ---------------------------------------------------------------------

    CREATE_TERRITORY: "territory:create",
    READ_TERRITORIES: "territory:read",
    UPDATE_TERRITORY: "territory:update",
    DELETE_TERRITORY: "territory:delete",

    // ---------------------------------------------------------------------
    // Reporting Hierarchy
    // ---------------------------------------------------------------------

    READ_HIERARCHY: "hierarchy:read",
    UPDATE_HIERARCHY: "hierarchy:update",
});

export default ORGANIZATION_PERMISSIONS;