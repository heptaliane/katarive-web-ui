import { useQuery } from "@tanstack/react-query";
import { useClient } from "../context";
import { JobStatus } from "../gen/api/v1/api_pb";

export const useJobStatus = (jobId: string | null) => {
  const client = useClient();
  return useQuery({
    queryKey: ["jobStatus", jobId],
    queryFn: () => client.getNarration({ id: jobId! }),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === JobStatus.PROGRESSING ? 2000 : false;
    },
  });
};
