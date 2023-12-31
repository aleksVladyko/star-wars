import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { useRouter } from "next/router";
import { MetricsKey } from "../../../helpers/metrics";
import { Asteroid } from "../../../types/asteroid";
import { getOrderAsteroids } from "../../../helpers/asteroid";
import structuredClone from "@ungap/structured-clone";

type ContextProps = {
    asteroids: Asteroid[];
    setAsteroids: React.Dispatch<React.SetStateAction<Asteroid[]>>;

    order: Asteroid[];
    setOrder: React.Dispatch<React.SetStateAction<Asteroid[]>>;
    addAsteroid: (asteroid: Asteroid) => void;
    removeAsteroid: (id: string) => void;
    confirmOrder: () => void;

    orderDuplicates: React.MutableRefObject<string[]>;

    selectedMetric: MetricsKey;
    changeMetric: (metric: MetricsKey) => void;

    showHazardous: boolean;
    changeShowHazardous: () => void;

    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const Context = createContext<ContextProps>({} as ContextProps);

export const ContextProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const router = useRouter();

    const [order, setOrder] = useState<Asteroid[]>([]);
    const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
    const orderDuplicates = useRef<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // записывать в localStorage
    useEffect(() => {
        if (!loading) {
            let formattedOrder = order.map((orderAs) => orderAs.id);
            localStorage.setItem(
                "asteroid-order",
                JSON.stringify(formattedOrder)
            );
        }
    }, [loading, order]);

    // парсить заказ с localStorage (из айди -> в астероид)
    useEffect(() => {
        let localOrder = localStorage.getItem("asteroid-order");
        if (!localOrder) {
            return;
        }

        (async () => {
            let parsedOrder: string[] = JSON.parse(localOrder);
            let order = Array.from(new Set(parsedOrder));

            let formateAsteroids = await getOrderAsteroids(order);
            if (!formateAsteroids) {
                return;
            }

            setOrder(formateAsteroids);
        })();
    }, []);

    //  ищет дубликаты и добавляет в реф (orderDuplicates), чтобы при рендере заказа брались уже существующие астероиды со списка (если тот прорендерен был)
    //  ренедерились вместе с астероидами с подгруженного списка из useEffect выше
    useEffect(() => {
        if (order) {
            setAsteroids((prev) => {
                let asteroidsCopy = structuredClone(prev);

                asteroidsCopy.forEach((asteroid: { id: string; ordered: boolean; }) => {
                    let sameAsteroid = order.find(
                        (orderAsteroid) => orderAsteroid.id === asteroid.id
                    );
                    if (sameAsteroid) {
                        asteroid.ordered = true;
                        orderDuplicates.current.push(sameAsteroid.id);
                    }
                });

                return asteroidsCopy;
            });
        }
    }, [order]);

    function addAsteroid(asteroid: Asteroid) {
        setAsteroids((prev) => {
            let asteroidsCopy = structuredClone(prev);

            asteroidsCopy.forEach((as: { id: string; ordered: boolean; }) => {
                if (as.id === asteroid.id) {
                    as.ordered = true;
                }
            });

            return asteroidsCopy;
        });
        setOrder((prev) => {
            let asteroidsCopy = structuredClone(prev);
            let formateAsteroid = { ...asteroid };
            formateAsteroid.ordered = true;
            asteroidsCopy.push(formateAsteroid);
            return asteroidsCopy;
        });
    }
    function removeAsteroid(id: string) {
        setAsteroids((prev) => {
            let asteroidsCopy = structuredClone(prev);

            asteroidsCopy.forEach((as: { id: string; ordered: boolean; }) => {
                if (as.id === id) {
                    as.ordered = false;
                }
            });

            return asteroidsCopy;
        });
        setOrder((prev) => {
            let asteroidsCopy = structuredClone(prev);
            asteroidsCopy = asteroidsCopy.filter((as: { id: string; }) => as.id !== id);
            return asteroidsCopy;
        });
    }
    function confirmOrder() {
        router.push("/");
        setOrder([]);
        setAsteroids((prev) => {
            return prev.map((as) => {
                if (as.ordered) {
                    as.ordered = false;
                }
                return as;
            });
        });
        orderDuplicates.current = [];
    }

    const [selectedMetric, setSelectedMetric] =
        useState<MetricsKey>("kiloMeters");
    function changeMetric(metric: MetricsKey) {
        setSelectedMetric(metric);
    }

    const [showHazardous, setShowHazardous] = useState<boolean>(false);
    function changeShowHazardous() {
        setShowHazardous((prev) => !prev);
    }

    return (
        <Context.Provider
            value={{
                asteroids,
                setAsteroids,

                order,
                setOrder,
                addAsteroid,
                confirmOrder,
                removeAsteroid,

                orderDuplicates,

                selectedMetric,
                changeMetric,

                showHazardous,
                changeShowHazardous,

                loading,
                setLoading,
            }}
        >
            {children}
        </Context.Provider>
    );
};

ContextProvider.displayName = "ContextProvider";

export function useAsteroidContext() {
    return useContext(Context);
}
