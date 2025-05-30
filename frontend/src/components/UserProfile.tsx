import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useParams, Link } from "react-router-dom";
import { GET_USER, USER_BORROWS } from "../graphql/queries";
import { useAuth } from "../context/AuthContext";
import UserBorrows from "./user/UserBorrows";
import BorrowStatistics from "./user/BorrowStatistics";
import ProfileEditor from "./ProfileEditor";

// Define a ME query to fetch the current user's data when needed
const ME_QUERY = `
  query Me {
    me {
      id
      email
      firstName
      lastName
      role
      profilePicture
      requiresPasswordChange
      createdAt
    }
  }
`;

const UserProfile: React.FC = () => {
  const params = useParams();
  const id = params?.id;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // Use the current user's ID if no ID is provided in the URL
  const userId = id || currentUser?.id;

  // Show loading state while auth state is being determined
  if (!isAuthenticated) {
    return (
      <div className="text-center py-8 text-red-500">
        Please log in to view user profiles
      </div>
    );
  }

  // Ensure we have a userId before proceeding
  if (!userId) {
    console.error("No userId available - currentUser:", currentUser);
    return (
      <div className="text-center py-8 text-red-500">
        User not found - No user ID available
      </div>
    );
  }

  // Fetch user data - always fetch, but we'll use currentUser data when possible
  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery(GET_USER, {
    variables: { id: userId },
    fetchPolicy: "cache-and-network",
    skip: Boolean(!userId || (currentUser && currentUser.id === userId)),
  });

  if (userLoading) {
    return <div className="text-center py-8">Loading profile...</div>;
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
        <div className="text-center py-8 text-red-500">
          Error loading profile: {userError.message}
        </div>
      );
    }

    if (!userData?.user) {
      console.error("No user data found for ID:", userId);
      return (
        <div className="text-center py-8 text-red-500">
          User not found (ID: {userId})
        </div>
      );
    }

    user = userData.user;
  }

  // Handle refreshing user data after profile update
  const handleProfileUpdate = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  // Safely handle user data for display
  const userInitials = `${user?.firstName?.charAt(0) || ""}${
    user?.lastName?.charAt(0) || ""
  }`;
  const userName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Unknown User";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showProfileEditor && (
        <ProfileEditor
          onClose={() => setShowProfileEditor(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              User Profile
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Personal details and account information.
            </p>
          </div>

          {currentUser && currentUser.id === userId && (
            <button
              onClick={() => setShowProfileEditor(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex-shrink-0">
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={userName}
                  className="h-32 w-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-500 dark:text-gray-400">
                  {userInitials || "?"}
                </div>
              )}
            </div>

            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {userName}
              </h2>

              <div className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user?.email || "No email provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Role
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : user?.role === "LIBRARIAN"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {user?.role || "USER"}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Member Since
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </dd>
                </div>

                {/* Account Status */}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Account Status
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  </dd>
                </div>

                {/* Access Level - Different display based on user role */}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Access Level
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user?.role === "ADMIN" && "Full system access"}
                    {user?.role === "LIBRARIAN" && "Library management access"}
                    {user?.role === "USER" && "Standard user access"}
                  </dd>
                </div>

                {/* Show last login or account update (placeholder) */}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Last Account Update
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date().toLocaleDateString()}{" "}
                    {/* This is a placeholder */}
                  </dd>
                </div>
              </div>

              {/* Show specific role-based information */}
              {user?.role === "ADMIN" && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-md font-medium text-blue-800 dark:text-blue-300">
                    Staff Information
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    As an administrator, you have full access to manage users,
                    books, and library operations.
                  </p>
                  <div className="mt-2">
                    <Link
                      to="/admin?tab=users"
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 transition-colors duration-200"
                    >
                      Go to Management Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
