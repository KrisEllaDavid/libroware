import React, { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GET_USER } from "../graphql/queries";
import { useAuth } from "../context/AuthContext";
import { User } from "../types";
import { fmtShort } from "../utils/date";
import ProfileEditor from "./ProfileEditor";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Icon,
  IconName,
  Skeleton,
  Tag,
  TagTone,
} from "./ui";

const ROLE_TONE: Record<string, TagTone> = {
  ADMIN: "accent",
  LIBRARIAN: "info",
  USER: "brand",
};

/** One label/value pair in the account details list. */
const Detail: React.FC<{
  icon: IconName;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <div className="flex items-start gap-3 py-3">
    <span
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
      aria-hidden="true"
    >
      <Icon name={icon} size={16} />
    </span>
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-gray-900 dark:text-white">
        {children}
      </dd>
    </div>
  </div>
);

const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const id = params?.id;
  const { user: currentUser, isAuthenticated, updateUser } = useAuth();
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // Use the current user's ID if no ID is provided in the URL
  const userId = id || currentUser?.id;

  // Show loading state while auth state is being determined
  if (!isAuthenticated) {
    return (
      <div className="app-shell page">
        <ErrorState title={t("profile.loginRequired")} />
      </div>
    );
  }

  // Ensure we have a userId before proceeding
  if (!userId) {
    console.error("No userId available - currentUser:", currentUser);
    return (
      <div className="app-shell page">
        <ErrorState title={t("profile.userNotFoundNoId")} />
      </div>
    );
  }

  // Fetch user data - always fetch, but we'll use currentUser data when possible
  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refetch,
  } = useQuery(GET_USER, {
    variables: { id: userId },
    fetchPolicy: "cache-and-network",
    skip: Boolean(!userId || (currentUser && currentUser.id === userId)),
  });

  if (userLoading) {
    return (
      <div className="app-shell page">
        <Card>
          <CardBody className="flex flex-col gap-6 sm:flex-row">
            <Skeleton className="h-28 w-28 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // For self-profile viewing, use the cached currentUser data
  let user;
  if (currentUser && currentUser.id === userId) {
    user = currentUser;
  } else {
    // For viewing other profiles, use the data from the GET_USER query
    if (userError) {
      console.error("User query error:", userError);
      return (
        <div className="app-shell page">
          <ErrorState
            title={t("profile.errorLoading", { message: "" })}
            message={userError.message}
            onRetry={() => refetch()}
          />
        </div>
      );
    }

    if (!userData?.user) {
      console.error("No user data found for ID:", userId);
      return (
        <div className="app-shell page">
          <ErrorState title={t("profile.userNotFound", { userId })} />
        </div>
      );
    }

    user = userData.user;
  }

  // Update AuthContext + Apollo cache instead of reloading the page
  const handleProfileUpdate = (updated?: Partial<User>) => {
    if (updated) updateUser(updated);
    refetch();
  };

  const userName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    t("profile.unknownUser");

  const isSelf = Boolean(currentUser && currentUser.id === userId);
  const role = user?.role || "USER";

  return (
    <div className="app-shell page max-w-4xl">
      {showProfileEditor && (
        <ProfileEditor
          onClose={() => setShowProfileEditor(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      <Card className="overflow-hidden">
        {/*
          A banner behind the avatar, with the avatar overlapping its lower
          edge. The identity block previously sat on flat white next to a plain
          grey circle, which made the page read as a form rather than a person.
        */}
        <div
          className="h-24 bg-emerald-700 sm:h-28 dark:bg-emerald-900"
          aria-hidden="true"
        />

        <CardBody className="pt-0">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar
                src={user?.profilePicture}
                firstName={user?.firstName}
                lastName={user?.lastName}
                size="2xl"
                className="border-4 border-white shadow-md dark:border-gray-900"
              />
              <div className="min-w-0 pb-1">
                <h1 className="break-words font-display text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {userName}
                </h1>
                <p className="mt-0.5 break-all text-sm text-gray-500 dark:text-gray-400">
                  {user?.email || t("profile.noEmailProvided")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Tag tone={ROLE_TONE[role] ?? "neutral"} icon="shield">
                    {role === "ADMIN"
                      ? t("users.roleAdmin")
                      : role === "LIBRARIAN"
                      ? t("users.roleLibrarian")
                      : t("users.roleUser")}
                  </Tag>
                  <Tag tone="brand" dot>
                    {t("profile.active")}
                  </Tag>
                </div>
              </div>
            </div>

            {isSelf && (
              <Button
                variant="primary"
                icon="edit"
                onClick={() => setShowProfileEditor(true)}
                className="shrink-0"
              >
                {t("profile.edit")}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t("profile.pageTitle")}
          description={t("profile.pageSubtitle")}
        />
        <CardBody>
          {/* Two columns from `sm` up, divided by a hairline rather than a box
              per field — a boxed grid for six read-only values is heavier than
              the values themselves. */}
          <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <Detail icon="mail" label={t("profile.email")}>
                {user?.email || t("profile.noEmailProvided")}
              </Detail>
              <Detail icon="calendar" label={t("profile.memberSince")}>
                {user?.createdAt ? fmtShort(user.createdAt) : t("profile.unknown")}
              </Detail>
              <Detail icon="refresh" label={t("profile.lastUpdate")}>
                {fmtShort(user?.updatedAt ?? null)}
              </Detail>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <Detail icon="shield" label={t("profile.role")}>
                {role}
              </Detail>
              <Detail icon="checkCircle" label={t("profile.accountStatus")}>
                {t("profile.active")}
              </Detail>
              <Detail icon="lock" label={t("profile.accessLevel")}>
                {role === "ADMIN"
                  ? t("profile.fullAccess")
                  : role === "LIBRARIAN"
                  ? t("profile.libraryAccess")
                  : t("profile.standardAccess")}
              </Detail>
            </div>
          </dl>
        </CardBody>
      </Card>

      {role === "ADMIN" && (
        <Card className="border-l-4 border-l-blue-500">
          <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                {t("profile.staffInfo")}
              </h2>
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {t("profile.staffInfoText")}
              </p>
            </div>
            <Link to="/admin?tab=users" className="shrink-0">
              <Button icon="grid" iconAfter="arrowRight">
                {t("profile.goToManagement")}
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default UserProfile;
