import { useMutation } from "@tanstack/react-query";
import { useClient } from "../context";

export const useCreateNarration = () => {
  const client = useClient();
  return useMutation({
    mutationFn: (url: string) => client.createNarration({ url }),
  });
};
