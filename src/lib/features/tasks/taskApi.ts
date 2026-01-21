import { api } from "../../api";

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  currentStage: string;
  assignedUsers: string[];
  dueDate: string;
  workflowId: string;
  createdBy: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  workflowId: string;
  assignedUsers: string[];
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  currentStage?: string;
  assignedUsers?: string[];
  dueDate?: string;
}

export interface MoveTaskRequest {
  taskId: string;
  newStage: string;
}

export const taskApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => "/tasks",
      providesTags: ["Task"],
    }),
    getTask: builder.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Task", id }],
    }),
    createTask: builder.mutation<Task, CreateTaskRequest>({
      query: (taskData) => ({
        url: "/tasks",
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: ["Task"],
    }),
    updateTask: builder.mutation<Task, { id: string; data: UpdateTaskRequest }>(
      {
        query: ({ id, data }) => ({
          url: `/tasks/${id}`,
          method: "PUT",
          body: data,
        }),
        invalidatesTags: (_result, _error, { id }) => [{ type: "Task", id }],
      },
    ),
    moveTask: builder.mutation<Task, MoveTaskRequest>({
      query: ({ taskId, newStage }) => ({
        url: `/tasks/${taskId}/move`,
        method: "PATCH",
        body: { newStage },
      }),
      invalidatesTags: ["Task"],
      async onQueryStarted({ taskId, newStage }, { dispatch, queryFulfilled }) {
        // Optimistic update
        const patchResult = dispatch(
          taskApi.util.updateQueryData("getTasks", undefined, (draft) => {
            const task = draft.find((t) => t._id === taskId);
            if (task) {
              task.currentStage = newStage;
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Task"],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useMoveTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
