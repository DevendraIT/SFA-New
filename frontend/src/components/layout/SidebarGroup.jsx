import { ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SidebarItem from "./SidebarItem";

export default function SidebarGroup({
  item,
  collapsed,
  open,
  toggle,
}) {
  const Icon = item.icon;
  const navigate = useNavigate();

  const handleClick = () => {
    toggle();
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div>

      <button
        onClick={handleClick}

        className="
          w-full
          flex
          items-center
          justify-between
          rounded-xl
          px-3
          py-3
          text-slate-700
          hover:bg-slate-100
          transition
        "
      >

        <div className="flex items-center gap-3">

          <Icon size={20} />

          {!collapsed && (

            <span className="font-medium text-sm">

              {item.title}

            </span>

          )}

        </div>

        {!collapsed &&
          (open ? (
            <ChevronDown size={18} />
          ) : (
            <ChevronRight size={18} />
          ))}

      </button>

      {!collapsed && open && (

        <div className="mt-2 ml-5 space-y-2 border-l border-slate-200 pl-4">

          {item.children.map((child) => (

            <SidebarItem
              key={child.title}
              item={child}
              collapsed={false}
            />

          ))}

        </div>

      )}

    </div>
  );
}