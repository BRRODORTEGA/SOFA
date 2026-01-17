"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SubItem {
  href: string;
  label: string;
  icon?: string;
}

interface AdminNavItemProps {
  href?: string;
  label: string;
  icon?: string;
  subItems?: SubItem[];
}

export function AdminNavItem({ href, label, icon, subItems }: AdminNavItemProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(
    subItems ? subItems.some(item => pathname.startsWith(item.href)) : false
  );

  const isActive = href && pathname === href;
  const hasActiveSubItem = subItems?.some(item => pathname.startsWith(item.href));

  if (subItems && subItems.length > 0) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-secondary hover:text-primary ${
            hasActiveSubItem ? "bg-secondary text-primary" : ""
          }`}
        >
          <span>
            {icon && <span className="mr-2">{icon}</span>}
            {label}
          </span>
          <span className={`text-xs transition-transform ${isExpanded ? "rotate-90" : ""}`}>
            ▸
          </span>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
            {subItems.map((subItem) => {
              const isSubActive = pathname.startsWith(subItem.href);
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isSubActive
                      ? "bg-secondary text-primary font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {subItem.icon && <span className="mr-1">{subItem.icon}</span>}
                  {subItem.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href || "#"}
      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary hover:text-primary ${
        isActive ? "bg-secondary text-primary" : "text-gray-700"
      }`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </Link>
  );
}

