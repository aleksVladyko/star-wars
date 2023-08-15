import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import AsteroidGrid from "../components/AsteroidsGrid";
import Button from "../components/Common/Button";
import { useAsteroidContext } from "../components/Common/Context";
import HeaderSecondary from "../components/Header/Secondary";
import Layout from "../components/Layout";
import { getApod } from "../helpers/apod-request";
import { ApodData } from "../types/apod";
import { Asteroid } from "../types/asteroid";

import classes from "../styles/pages/order/order.module.scss";

type OrderPageProps = ApodData & {};

const Order: NextPage<OrderPageProps> = ({ apod }) => {
    const { order, asteroids, orderDuplicates, setLoading, confirmOrder } =
        useAsteroidContext();

    const renderLocalOrder = (): Asteroid[] => {
        let result = order.filter((orderAsteroid: { id: any; }) => {
            let duplicate = orderDuplicates.current.find(
                (asId: any) => asId === orderAsteroid.id
            );
            if (!duplicate) {
                return true;
            }
            return false;
        });

        setTimeout(() => {
            setLoading(false);
        }, 1);
        return result;
    };

    return (
        <Layout apod={apod}>
            <Head>
                <title>Order - StarWars</title>
            </Head>
            <HeaderSecondary title="Заказ" />
            <div className={classes.orderWrapper}>
                <AsteroidGrid
                    asteroids={[
                        ...renderLocalOrder(),
                        ...asteroids.filter((as: { ordered: boolean; }) => as.ordered === true),
                    ]}
                    initialDate={new Date()}
                    errorText={"Астероидов нет в заказе"}
                    infiniteLoad={false}
                />
                {order.length > 0 ? (
                    <Button
                        color="#FFF"
                        onClick={() => confirmOrder()}
                        dontStretch
                    >
                        Отправить бригаду им. Брюса Уиллиса
                    </Button>
                ) : (
                    <></>
                )}
            </div>
        </Layout>
    );
};

export const getServerSideProps: GetServerSideProps<
    OrderPageProps
> = async () => {
    let apod = await getApod();

    return { props: { apod } };
};

export default Order;
