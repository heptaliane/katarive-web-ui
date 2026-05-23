import { useMutation, useQuery } from "@tanstack/react-query";
import { useClient } from "../context";
import { JobStatus } from "../gen/api/v1/api_pb";

export const useQueueSourceCollection = () => {
  const client = useClient();
  return useMutation({
    mutationFn: ({ url, disableCache }: { url: string; disableCache?: boolean }) =>
      client.queueSourceCollection({ url, disableCache }),
  });
};

export const useSourceCollection = (collectionId: string | null) => {
  const client = useClient();
  return useQuery({
    queryKey: ["sourceCollection", collectionId],
    queryFn: () => client.getSourceCollection({ id: collectionId! }),
    enabled: !!collectionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === JobStatus.PROGRESSING ? 2000 : false;
    },
  });
};
