"use client"

import { ChevronRight, UserPlus, Globe, Link, MessageSquare, FileText, Archive, Settings } from "lucide-react"
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

export function NavMain() {
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

  // Settings items
  const settingsItems = [
    {
      title: "Page Settings",
      url: "/settings/page",
      icon: Globe,
    },
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {/* Artikler link - now single page */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Artikler">
            <NextLink href="/artikler">
              <FileText className="h-4 w-4" />
              <span>Artikler</span>
            </NextLink>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Arkiv link */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Arkiv">
            <NextLink href="/arkiv">
              <Archive className="h-4 w-4" />
              <span>Arkiv</span>
            </NextLink>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Prompts link - visible for all users */}
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Prompts">
            <NextLink href="/prompts">
              <MessageSquare className="h-4 w-4" />
              <span>Prompts</span>
            </NextLink>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Settings dropdown */}
        <Collapsible asChild className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                <span>Settings</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {settingsItems.map((settingsItem) => (
                  <SidebarMenuSubItem key={settingsItem.title}>
                    <SidebarMenuSubButton asChild>
                      <NextLink href={settingsItem.url}>
                        {settingsItem.icon && <settingsItem.icon className="h-4 w-4" />}
                        <span>{settingsItem.title}</span>
                      </NextLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

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
