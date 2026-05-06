import { useQuery } from "@tanstack/react-query";
import { useClient } from "../context";

export const useGetSpeakers = () => {
  const client = useClient();
  return useQuery({
    queryKey: ["speakers"],
    queryFn: () => client.getSpeakers({}),
  });
};
