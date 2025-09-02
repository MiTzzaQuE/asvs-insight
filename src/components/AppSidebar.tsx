import { useLocation } from 'react-router-dom';
import { Shield, BarChart3, FileText, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from 'react-router-dom';

const mainItems = [
  { title: 'Dashboard', url: '/', icon: BarChart3 },
  { title: 'Results', url: '/results', icon: FileText },
  { title: 'Admin', url: '/admin', icon: Settings },
];

// Will be populated with sections from the database
const sectionItems = [
  { title: 'Architecture', url: '/section/architecture' },
  { title: 'Authentication', url: '/section/authentication' },
  { title: 'Session Management', url: '/section/session-management' },
  { title: 'Access Control', url: '/section/access-control' },
  { title: 'Input Validation', url: '/section/input-validation' },
  { title: 'Cryptography at Rest', url: '/section/cryptography-at-rest' },
  { title: 'Error Handling and Logging', url: '/section/error-handling-and-logging' },
  { title: 'Data Protection', url: '/section/data-protection' },
  { title: 'Communication Security', url: '/section/communication-security' },
  { title: 'Malicious Code', url: '/section/malicious-code' },
  { title: 'Business Logic', url: '/section/business-logic' },
  { title: 'Files and Resources', url: '/section/files-and-resources' },
  { title: 'API and Web Service', url: '/section/api-and-web-service' },
  { title: 'Configuration', url: '/section/configuration' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5 text-primary" />
            {!isCollapsed && <span>ASVS L1</span>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Security Sections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sectionItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <Shield className="h-4 w-4" />
                      {!isCollapsed && <span className="text-xs">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}