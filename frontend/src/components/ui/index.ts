/**
 * The Libroware UI kit.
 *
 * One import site for every shared surface, control and state. Pages should
 * reach for these before writing raw Tailwind — that is what keeps the admin
 * tables, the member dashboard and the modals reading as one product.
 */

export { default as cn } from "./cn";

export { default as Icon } from "./Icon";
export type { IconName, IconProps } from "./Icon";

export { default as Button, IconButton, Spinner } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export {
  default as Card,
  CardHeader,
  CardBody,
  CardFooter,
  SectionLabel,
} from "./Card";
export type { CardProps, CardHeaderProps } from "./Card";

export { default as PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";

export { default as StatCard, StatAccent } from "./StatCard";
export type { StatCardProps, StatTone } from "./StatCard";

export {
  default as Field,
  Input,
  Textarea,
  Select,
  SearchInput,
  Checkbox,
} from "./Field";
export type {
  FieldProps,
  InputProps,
  TextareaProps,
  SelectProps,
  SearchInputProps,
  CheckboxProps,
} from "./Field";

export { default as Tag, StatusTag, statusTone } from "./Tag";
export type { TagProps, TagTone, StatusTagProps } from "./Tag";

export { default as Tabs, Segmented } from "./Tabs";
export type { TabItem, TabsProps, SegmentedProps } from "./Tabs";

export {
  default as Table,
  TableWrap,
  THead,
  TBody,
  TR,
  TH,
  TD,
  RowActions,
  TableMessage,
  StackedMeta,
} from "./Table";

export {
  default as EmptyState,
  ErrorState,
  Alert,
  Skeleton,
  TableSkeleton,
  CardGridSkeleton,
  StatSkeleton,
} from "./States";
export type { EmptyStateProps, ErrorStateProps, AlertProps } from "./States";

export { default as Avatar } from "./Avatar";
export type { AvatarProps } from "./Avatar";

export { default as BookCover } from "./BookCover";
export type { BookCoverProps } from "./BookCover";

export { LibraryScene, BookStackMark, ShelfBand } from "./Artwork";
