import UpdateItem from '../components/UpdateItem';

const SellPage = props => (
  <div>
    <UpdateItem id={props.query.id} />
  </div>
);

export default SellPage;
