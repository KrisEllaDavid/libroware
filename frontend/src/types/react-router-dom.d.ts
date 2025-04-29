declare module 'react-router-dom' {
  import { ComponentType, ReactNode } from 'react';

  export interface RouteProps {
    path?: string;
    element?: React.ReactNode;
    children?: React.ReactNode;
  }

  export interface NavigateProps {
    to: string;
    replace?: boolean;
    state?: any;
  }

  export interface LinkProps {
    to: string;
    replace?: boolean;
    state?: any;
    className?: string;
    children?: ReactNode;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  }

  export interface LocationType {
    pathname: string;
    search: string;
    hash: string;
    state: any;
    key: string;
  }

  export interface NavigateFunction {
    (to: string, options?: { replace?: boolean; state?: any }): void;
    (delta: number): void;
  }

  export interface Params {
    [key: string]: string;
  }

  export const BrowserRouter: ComponentType<{ children: ReactNode }>;
  export const Routes: ComponentType<{ children: ReactNode }>;
  export const Route: ComponentType<RouteProps>;
  export const Navigate: ComponentType<NavigateProps>;
  export const Link: ComponentType<LinkProps>;
  export const useLocation: () => LocationType;
  export const useParams: <T extends Params = Params>() => T;
  export const useNavigate: () => NavigateFunction;
}