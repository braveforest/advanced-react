import React from 'react';
import StripeCheckout from 'react-stripe-checkout';
import { Mutation } from 'react-apollo';
import Router from 'next/router';
import NProgress from 'nprogress';
import gql from 'graphql-tag';
import calcTotalPrice from '../utils/calcTotalPrice';
import User, { CURRENT_USER_QUERY } from './User';

const CREATE_ORDER_MUTATION = gql`
  mutation createOrder($token: String!) {
    createOrder(token: $token) {
      id
      charge
      total
      items {
        id
        title
      }
    }
  }
`;

const CheckOut = props => {

  const totalItems = cart => {
    return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0);
  }

  const onToken = async (res, createOrder) => {
    NProgress.start();
    // manually call the mutation once we have the stripe token
    const order = await createOrder({
      variables: {
        token: res.id,
      },
    }).catch(err => {
      alert(err.message);
    });
    Router.push({
      pathname: '/order',
      query: { id: order.data.createOrder.id },
    });
  };

  return(
    <User>
      {({ data: { me }, loading }) => {
        if (loading) return null;
        return (
          <Mutation
            mutation={CREATE_ORDER_MUTATION}
            refetchQueries={[{ query: CURRENT_USER_QUERY }]}
          >
            {createOrder => (
              <StripeCheckout
                amount={calcTotalPrice(me.cart)}
                name="Sick Fits"
                description={`Order of ${totalItems(me.cart)} items!`}
                image={me.cart.length && me.cart[0].item && me.cart[0].item.image}
                stripeKey="pk_test_QlqorwGEMgYIqKinj1c3RDQm"
                currency="USD"
                email={me.email}
                token={res => onToken(res, createOrder)}
              >
                {props.children}
              </StripeCheckout>
            )}
          </Mutation>
        );
      }}
    </User>
  );
};

export default CheckOut;
export { CREATE_ORDER_MUTATION };
