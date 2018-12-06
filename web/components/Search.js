import { useState } from 'react';
import Downshift, { resetIdCounter } from 'downshift';
import Router from 'next/router';
import { ApolloConsumer } from 'react-apollo';
import gql from 'graphql-tag';
import debounce from 'lodash.debounce';
import { DropDown, DropDownItem, SearchStyles } from './styles/DropDown';

const SEARCH_ITEMS_QUERY = gql`
  query SEARCH_ITEMS_QUERY($searchTerm: String!) {
    items(where: { OR: [{ title_contains: $searchTerm }, { description_contains: $searchTerm }] }) {
      id
      image
      title
    }
  }
`;

const AutoComplete = () => {

  const [state, setState] = useState({
    items: [],
    loading: false,
  });

  const routeToItem = item => {
    Router.push({
      pathname: '/item',
      query: {
        id: item.id,
      },
    });
  };

  const onChange = debounce(async (e, client) => {
    // turn loading on
    setState({ ...state, loading: true });
    // Manually query apollo client
    const res = await client.query({
      query: SEARCH_ITEMS_QUERY,
      variables: { searchTerm: e.target.value },
    });
    setState({
      ...state,
      items: res.data.items,
      loading: false,
    });
  }, 350);

  return resetIdCounter() || (
    <SearchStyles>
    <Downshift onChange={routeToItem} itemToString={item => (item === null ? '' : item.title)}>
      {({ getInputProps, getItemProps, isOpen, inputValue, highlightedIndex }) => (
        <div>
          <ApolloConsumer>
            {client => (
              <input
                {...getInputProps({
                  type: 'search',
                  placeholder: 'Search For An Item',
                  id: 'search',
                  className: state.loading ? 'loading' : '',
                  onChange: e => {
                    e.persist();
                    onChange(e, client);
                  },
                })}
              />
            )}
          </ApolloConsumer>
          {isOpen && (
            <DropDown>
              {state.items.map((item, index) => (
                <DropDownItem
                  {...getItemProps({ item })}
                  key={item.id}
                  highlighted={index === highlightedIndex}
                >
                  <img width="50" src={item.image} alt={item.title} />
                  {item.title}
                </DropDownItem>
              ))}
              {!state.items.length &&
                !state.loading && <DropDownItem> Nothing Found {inputValue}</DropDownItem>}
            </DropDown>
          )}
        </div>
      )}
    </Downshift>
    </SearchStyles >
  );
};

export default AutoComplete;
