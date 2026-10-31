import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/server/routers";

export function errorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    const typedError = error as TRPCClientError<AppRouter>;
    if (typedError.data?.code === "NOT_FOUND")
      return "Task not found. It may have been deleted. Return to the task list and try again.";
    if (typedError.data?.code === "BAD_REQUEST")
      return "Please check the title and description and try again.";
  }
  return "Unable to complete this action. Please try again.";
}
