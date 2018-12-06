import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { CURRENT_USER_QUERY } from './User';

const ADD_TO_CART_MUTATION = gql`
  mutation addToCart($id: ID!) {
    addToCart(id: $id) {
      id
      quantity
    }
  }
`;

const AddToCart = props => (
  <Mutation
    mutation={ADD_TO_CART_MUTATION}
    variables={{
      id: props.id,
    }}
    refetchQueries={[{ query: CURRENT_USER_QUERY }]}
  >
    {(addToCart, { loading }) => (
      <button disabled={loading} onClick={addToCart}>
        Add{loading && 'ing'} To Cart 🛒
      </button>
    )}
  </Mutation>
)

AddToCart.propTypes = {
  id: PropTypes.string.isRequired,
};

export default AddToCart;
export { ADD_TO_CART_MUTATION };
