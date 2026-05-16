import { useQuery } from "@tanstack/react-query";
import { useClient } from "../context";

export const useGetNarrators = () => {
  const client = useClient();
  return useQuery({
    queryKey: ["narrators"],
    queryFn: () => client.getNarrators({}),
  });
};
