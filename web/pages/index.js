import Items from '../components/Items';

const HomePage = props => (
  <div>
    <Items page={parseFloat(props.query.page) || 1} />
  </div>
);

export default HomePage;
