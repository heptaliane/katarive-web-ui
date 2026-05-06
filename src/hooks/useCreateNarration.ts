import { useMutation } from "@tanstack/react-query";
import { useClient } from "../context";

export const useCreateNarration = () => {
  const client = useClient();
  return useMutation({
    mutationFn: ({ url, narrator, speakerId }: { url: string; narrator: string; speakerId: number }) => 
      client.createNarration({ url, narrator, speakerId }),
  });
};
