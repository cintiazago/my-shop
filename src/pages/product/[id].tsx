import axios from "axios"
import Image from "next/image"
import Stripe from "stripe"
import { GetStaticPaths, GetStaticProps } from "next"
import { stripe } from "../../lib/stripe"
import { ImageContainer, ProductContainer, ProductDetails } from "../../styles/pages/product"
import { useState } from "react"
import Head from "next/head"

interface ProductProps {
    product: {
        id: string;
        name: string;
        imageUrl: string;
        price: string;
        description: string;
        defaultPrice: string;
    }
}

export default function Product({ product }: ProductProps) {
    const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false);
    
    async function handleByProduct() {
        try {
            setIsCreatingCheckoutSession(true);
            const response = await axios.post('/api/checkout/', {
                priceId: product.defaultPrice,
            })

            const { checkoutUrl } = response.data;

            window.location.href = checkoutUrl;
        } catch (err) {
            setIsCreatingCheckoutSession(false);
            console.error(err);            
            alert('Falha ao redirecionar ao checkout')
        }
    }

    return (
        <>
            <Head>
                <title>{product.name} | Ignite Shop</title>
            </Head>

            <ProductContainer>
                <ImageContainer>
                    <Image src={product.imageUrl} width={520} height={480} alt="" />
                </ImageContainer>

                <ProductDetails>
                    <h1>{product.name}</h1>
                    <span>{product.price}</span>

                    <p>{product.description}</p>

                    <button onClick={handleByProduct}>
                        Comprar agora
                    </button>
                </ProductDetails>

            </ProductContainer>
        </>
    )
}

export const getStaticPaths: GetStaticPaths = async () => {
    // Ideal: buscar apenas produtos mais vendidos ou mais acessados para carregar no build

    return {
        paths: [
            {
                params: {
                    id: "prod_MoAvHE7g2NlaJh",
                },
            }
        ],
        fallback: true, // blocking: para a pagina nao ficar no loading e so ser exibida apos o carregamento total da pagina
    }
}

export const getStaticProps: GetStaticProps<any, { id: string }> = async ({ params }) => {
    const productId = params.id;

    const product = await stripe.products.retrieve(productId, {
        expand: ['default_price']
    });

    const price = product.default_price as Stripe.Price

    return {
        props: {
            product: {
                id: product.id,
                name: product.name,
                imageUrl: product.images[0],
                price: new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                }).format(price.unit_amount / 100),
                description: product.description,
                defaultPrice: price.id,
            }
        },
        revalidate: 60 * 60 * 1, // 1 hour
    }
}