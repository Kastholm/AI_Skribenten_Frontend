"use client"

import { ChevronRight, UserPlus, Globe, Link, MessageSquare, type LucideIcon } from "lucide-react"
import { useAuth } from "@/app/context/auth-context"
import NextLink from "next/link"

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

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  // Create admin items array
  const adminItems = [
    {
      title: "Add User",
      url: "/add-user",
      icon: UserPlus,
    },
    {
      title: "Add Site",
      url: "/add-site",
      icon: Globe,
    },
    {
      title: "Link User Site",
      url: "/link-user-site",
      icon: Link,
    },
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
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
            </SidebarMenuItem>
          </Collapsible>
        ))}

        {/* Prompts link - visible for all users */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Prompts">
            <NextLink href="/prompts">
              <MessageSquare className="h-4 w-4" />
              <span>Prompts</span>
            </NextLink>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Admin dropdown - only visible for admin users */}
        {isAdmin && (
          <Collapsible asChild className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Admin">
                  <UserPlus />
                  <span>Admin</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {adminItems.map((adminItem) => (
                    <SidebarMenuSubItem key={adminItem.title}>
                      <SidebarMenuSubButton asChild>
                        <NextLink href={adminItem.url}>
                          {adminItem.icon && <adminItem.icon className="h-4 w-4" />}
                          <span>{adminItem.title}</span>
                        </NextLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
