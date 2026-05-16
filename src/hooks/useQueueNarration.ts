import { useMutation } from "@tanstack/react-query";
import { useClient } from "../context";

export const useQueueNarration = () => {
  const client = useClient();
  return useMutation({
    mutationFn: ({ url, narrator, speakerId }: { url: string; narrator: string; speakerId: number }) => 
      client.queueNarration({ url, narrator, speakerId }),
  });
};
