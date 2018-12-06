import { useState } from 'react';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const RESET_MUTATION = gql`
  mutation RESET_MUTATION($resetToken: String!, $password: String!, $confirmPassword: String!) {
    resetPassword(resetToken: $resetToken, password: $password, confirmPassword: $confirmPassword) {
      id
      email
      name
    }
  }
`;

const Reset = props => {

  const [state, setState] = useState({
    password: '',
    confirmPassword: '',
  });

  const saveToState = e => {
    setState({ ...state, [e.target.name]: e.target.value });
  };

  return(
    <Mutation
      mutation={RESET_MUTATION}
      variables={{
        resetToken: props.resetToken,
        password: state.password,
        confirmPassword: state.confirmPassword,
      }}
      refetchQueries={[{ query: CURRENT_USER_QUERY }]}
    >
      {(reset, { error, loading, called }) => (
        <Form
          method="post"
          onSubmit={async e => {
            e.preventDefault();
            await reset();
            setState({ password: '', confirmPassword: '' });
          }}
        >
          <fieldset disabled={loading} aria-busy={loading}>
            <h2>Reset Your Password</h2>
            <Error error={error} />
            <label htmlFor="password">
              Password
                <input
                type="password"
                name="password"
                placeholder="password"
                value={state.password}
                onChange={saveToState}
              />
            </label>

            <label htmlFor="confirmPassword">
              Confirm Your Password
                <input
                type="password"
                name="confirmPassword"
                placeholder="confirmPassword"
                value={state.confirmPassword}
                onChange={saveToState}
              />
            </label>

            <button type="submit">Reset Your Password!</button>
          </fieldset>
        </Form>
      )}
    </Mutation>
  );
};

Reset.propTypes = {
  resetToken: PropTypes.string.isRequired,
};

export default Reset;
