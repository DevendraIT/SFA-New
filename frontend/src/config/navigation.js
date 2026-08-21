import {
  LayoutDashboard,
  Building2,
  Building,
  GitBranch,
  LayoutGrid,
  Users,
  UserCog,
  BrainCircuit,
  UserRoundSearch,
  ShoppingCart,
  MapPinned,
  Target,
  BarChart3,
  Bell,
  Settings,
  LogIn,
  Map,
  Navigation,
  ClipboardCheck,
  Camera,
  StickyNote,
  IndianRupee,
  Calendar,
  Activity,
  FileText,
  User,
  MapPin,
  Package,
  Warehouse,
  Layers,
} from "lucide-react";

const navigation = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },

  {
    title: "Inventory",
    icon: Package,
    children: [
      {
        title: "Products",
        path: "/inventory/products",
        icon: Package,
      },
      {
        title: "Warehouses",
        path: "/inventory/warehouses",
        icon: Warehouse,
      },
      {
        title: "Stock",
        path: "/inventory/stock",
        icon: Layers,
      },
      {
        title: "Stock Movements",
        path: "/inventory/stock-movements",
        icon: Activity,
      },
    ],
  },

  {
    title: "Organization",
    icon: Building2,
    children: [
      {
        title: "Organization",
        path: "/organization/organization",
        icon: Building,
      },
      {
        title: "Department",
        path: "/organization/department",
        icon: LayoutGrid,
      },
      {
        title: "Territory",
        path: "/organization/territory",
        icon: MapPin,
      },
      {
        title: "Branch",
        path: "/organization/branch",
        icon: GitBranch,
      },
      {
        title: "Teams",
        path: "/organization/teams",
        icon: Users,
      },
      {
        title: "Users",
        path: "/organization/users",
        icon: UserCog,
      },
      {
        title: "Warehouses",
        path: "/inventory/warehouses",
        icon: Warehouse,
      },
    ],
  },

  {
    title: "Team Management",
    icon: Users,
    children: [
      {
        title: "My Team",
        path: "/team/manage",
        icon: Users,
      },
      {
        title: "Assigned Tasks",
        path: "/team/assigned-tasks",
        icon: BrainCircuit,
      },
      {
        title: "Performance",
        path: "/team/performance",
        icon: Target,
      },
    ],
  },

  {
    title: "Sales Orders",
    icon: ShoppingCart,
    path: "/orders",
  },

  {
    title: "Field Force",
    icon: MapPinned,
    children: [
      {
        title: "Dashboard",
        path: "/field-force/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Beat Plans",
        path: "/field-force/beat-plans",
        icon: Map,
      },
      {
        title: "Route",
        path: "/field-force/route",
        icon: Navigation,
      },
      {
        title: "Tasks",
        path: "/field-force/tasks",
        icon: Target,
      },
      {
        title: "Visits",
        path: "/field-force/visits",
        icon: ClipboardCheck,
      },
      {
        title: "Photos",
        path: "/field-force/photo-upload",
        icon: Camera,
      },
      {
        title: "Meeting Notes",
        path: "/field-force/meeting-notes",
        icon: StickyNote,
      },
      {
        title: "Expenses",
        path: "/field-force/expenses",
        icon: IndianRupee,
      },
      {
        title: "Calendar",
        path: "/field-force/calendar",
        icon: Calendar,
      },
      {
        title: "Activities",
        path: "/field-force/activities",
        icon: Activity,
      },
      {
        title: "DAR",
        path: "/field-force/dar",
        icon: FileText,
      },
      {
        title: "Profile",
        path: "/field-force/profile",
        icon: User,
      },
    ],
  },

  {
    title: "Target & Performance",
    icon: Target,
    path: "/performance",
  },

  {
    title: "Reports",
    icon: BarChart3,
    path: "/reports",
  },

  {
    title: "Notifications",
    icon: Bell,
    path: "/notifications",
  },

  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export default navigation;
