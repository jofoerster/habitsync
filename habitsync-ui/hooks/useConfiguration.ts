import {serverConfigApi} from "@/services/api";
import {useQuery} from "@tanstack/react-query";

export const useConfiguration = () => {
    return useQuery({
        queryKey: ["configuration"],
        queryFn: () => serverConfigApi.getServerConfig(),
        staleTime: 1000 * 60 * 60,
    });
};