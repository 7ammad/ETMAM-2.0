/* ═══════════════════════════════════════════════
   Etmam 2.0 Design System — Barrel Exports

   Usage:
     import { Button, Card, Badge } from "@/components/ui"

   Atomic Design Structure:
     Atoms      → Button, Badge, Input, Textarea, Label, Spinner, Avatar, Separator
     Molecules  → Card, FormField, Select, Tabs, Dialog, Tooltip, Dropzone, Toast
     Organisms  → DataTable, ScoreBadge, StatusBadge, EmptyState, Alert, Progress
     Layout     → Container, PageHeader, Section
     Skeletons  → Skeleton, SkeletonText, SkeletonCard
   ═══════════════════════════════════════════════ */

// ── Atoms ──
export { Button, buttonVariants } from "./button";
export type { ButtonProps } from "./button";

export { Badge, badgeVariants } from "./badge";
export type { BadgeProps } from "./badge";

export { Input } from "./input";
export type { InputProps } from "./input";

export { Textarea } from "./textarea";
export type { TextareaProps } from "./textarea";

export { Label } from "./label";
export type { LabelProps } from "./label";

export { Spinner } from "./spinner";
export type { SpinnerProps } from "./spinner";

export { Avatar } from "./avatar";
export type { AvatarProps } from "./avatar";

export { Separator } from "./separator";
export type { SeparatorProps } from "./separator";

// ── Molecules ──
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

export { FormField } from "./form-field";
export type { FormFieldProps } from "./form-field";

export { Select } from "./select";
export type { SelectProps } from "./select";

export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

export { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogClose } from "./dialog";

export { Tooltip } from "./tooltip";
export type { TooltipProps } from "./tooltip";

export { Dropzone } from "./dropzone";
export type { DropzoneProps } from "./dropzone";

export { Toaster, toast } from "./toast";

// ── Organisms ──
export { DataTable } from "./data-table";
export type { DataTableProps, Column } from "./data-table";

export { ScoreBadge, getScoreLabel } from "./score-badge";
export type { ScoreBadgeProps } from "./score-badge";

export { StatusBadge } from "./status-badge";
export type { StatusBadgeProps, TenderStatus } from "./status-badge";

export { EmptyState } from "./empty-state";
export type { EmptyStateProps } from "./empty-state";

export { Alert, alertVariants } from "./alert";
export type { AlertProps } from "./alert";

export { Progress } from "./progress";
export type { ProgressProps } from "./progress";

// ── Skeletons ──
export { Skeleton, SkeletonText, SkeletonCard } from "./skeleton";
export type { SkeletonProps } from "./skeleton";

// ── Layout ──
export { Container } from "./container";
export type { ContainerProps } from "./container";

export { PageHeader } from "./page-header";
export type { PageHeaderProps, BreadcrumbItem } from "./page-header";

export { Section } from "./section";
export type { SectionProps } from "./section";
