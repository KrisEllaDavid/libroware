import React from 'react';
import { useQuery, gql } from '@apollo/client';

const HELLO_QUERY = gql`
  query GetHello {
    hello
  }
`;

const Home: React.FC = () => {
  const { loading, error, data } = useQuery(HELLO_QUERY);

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Libroware</h1>
      <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto">
        <p className="text-gray-700">Server says: {data.hello}</p>
      </div>
    </div>
  );
};

export default Home; 