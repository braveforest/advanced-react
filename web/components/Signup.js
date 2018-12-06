import { useState } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const SIGNUP_MUTATION = gql`
  mutation SIGNUP_MUTATION($email: String!, $name: String!, $password: String!) {
    signup(email: $email, name: $name, password: $password) {
      id
      email
      name
    }
  }
`;

const Signup = () => {

  const [state, setState] = useState({
    name: '',
    email: '',
    password: ''
  });

  const saveToState = e => {
    setState({ ...state, [e.target.name]: e.target.value });
  };

  return(
    <Mutation
      mutation={SIGNUP_MUTATION}
      variables={state}
      refetchQueries={[{ query: CURRENT_USER_QUERY }]}
    >
      {(signup, { error, loading }) => (
        <Form
          method="post"
          onSubmit={async e => {
            e.preventDefault();
            await signup();
            setState({ name: '', email: '', password: '' });
          }}
        >
          <fieldset disabled={loading} aria-busy={loading}>
            <h2>Sign Up for An Account</h2>
            <Error error={error} />
            <label htmlFor="email">
              Email
                <input
                type="email"
                name="email"
                placeholder="email"
                value={state.email}
                onChange={saveToState}
              />
            </label>
            <label htmlFor="name">
              Name
                <input
                type="text"
                name="name"
                placeholder="name"
                value={state.name}
                onChange={saveToState}
              />
            </label>
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

            <button type="submit">Sign Up!</button>
          </fieldset>
        </Form>
      )}
    </Mutation>
  );
};

export default Signup;
export { SIGNUP_MUTATION };
