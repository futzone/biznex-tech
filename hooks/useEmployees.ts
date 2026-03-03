import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pb from "@/lib/pb";
import type { User } from "@/lib/types";

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: () =>
      pb.collection("users").getFullList<User>({
        sort: "name",
        filter: 'is_active!=false',
      }),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: () => pb.collection("users").getOne<User>(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      role: "admin" | "manager" | "employee";
      phone?: string;
    }) => {
      return pb.collection("users").create({
        ...data,
        passwordConfirm: data.password,
        is_active: true,
        emailVisibility: true,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      phone?: string;
      role?: string;
      is_active?: boolean;
      password?: string;
      passwordConfirm?: string;
    }) => {
      return pb.collection("users").update(id, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}
