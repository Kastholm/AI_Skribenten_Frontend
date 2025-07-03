"use client"

import { ChevronRight, FileText, Settings, MessageSquare, Users, Globe, Plus } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/app/context/auth-context"

export function NavMain() {
  const { user } = useAuth()

  const items = [
    {
      title: "Artikler",
      url: "#",
      icon: FileText,
      isActive: true,
      defaultOpen: true,
      items: [
        {
          title: "Scheduled",
          url: "/artikler/scheduled",
        },
        {
          title: "Review",
          url: "/artikler/review",
        },
        {
          title: "Archive",
          url: "/artikler/archive",
        },
      ],
    },
    {
      title: "Prompts",
      url: "/prompts",
      icon: MessageSquare,
    },
    {
      title: "Settings",
      url: "/settings/page",
      icon: Settings,
    },
  ]

  // Add admin-only items
  if (user?.role === "admin") {
    items.push(
      {
        title: "Add User",
        url: "/add-user",
        icon: Users,
      },
      {
        title: "Add Site",
        url: "/add-site",
        icon: Globe,
      },
      {
        title: "Link User-Site",
        url: "/link-user-site",
        icon: Plus,
      },
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.defaultOpen} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.items && (
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.items && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
