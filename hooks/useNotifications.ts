import { getUnreadNotificationsCount, markNotificationRead } from "@/src/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const UNREAD_COUNT_KEY = ["notifications-unread-count"];

/** Live unread-notification count, polled so the badge stays current. */
export function useUnreadNotificationsCount() {
  const { data } = useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: getUnreadNotificationsCount,
    refetchInterval: 15000,
  });
  return data?.unread_count ?? 0;
}

/**
 * Mark a single notification as read (PATCH .../mark_read/) and refresh the
 * unread count + notification lists so the UI updates immediately.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
      queryClient.invalidateQueries({ queryKey: ["home-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
