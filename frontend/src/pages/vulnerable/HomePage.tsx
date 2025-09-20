import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { vulnerableApi, Product } from '../../services/api';
import toast from 'react-hot-toast';

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await vulnerableApi.getProducts();
      setProducts(data.products.slice(0, 6)); // Show first 6 products
    } catch (error) {
      toast.error('Failed to load products');
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const demoAttacks = [
    {
      title: "Authentication Bypass",
      description: "Try logging in with NoSQL injection",
      payload: `{"username": "admin", "password": {"$ne": null}}`,
      action: "Go to Login",
      link: "/vulnerable/login"
    },
    {
      title: "Data Exfiltration",
      description: "Access user profiles with injection",
      payload: `{"$ne": null}`,
      action: "Go to Profile",
      link: "/vulnerable/profile"
    },
    {
      title: "Search Injection",
      description: "Bypass search filters",
      payload: `{"$where": "function() { return true; }"}`,
      action: "Try Search",
      link: "/vulnerable/search?q=" + encodeURIComponent('{"$where": "function() { return true; }"}')
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="vulnerable-card rounded-xl p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to VulnShop
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          An intentionally vulnerable e-commerce platform for security testing
        </p>
        <div className="flex items-center justify-center space-x-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <span className="text-red-600 font-semibold">
            This application contains deliberate security vulnerabilities
          </span>
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            to="/vulnerable/products"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Browse Products
          </Link>
          <Link
            to="/dashboard"
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Security Dashboard
          </Link>
        </div>
      </section>

      {/* Attack Demo Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🔍 Try These Attack Vectors
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {demoAttacks.map((attack, index) => (
            <div key={index} className="vulnerable-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {attack.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {attack.description}
              </p>
              <div className="bg-gray-100 p-3 rounded-md mb-4">
                <code className="text-sm text-red-600 break-all">
                  {attack.payload}
                </code>
              </div>
              <Link
                to={attack.link}
                className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                {attack.action}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
          <Link
            to="/vulnerable/products"
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            View All Products →
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="vulnerable-card rounded-lg p-6 animate-pulse">
                <div className="bg-gray-300 h-48 rounded-md mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product._id} className="vulnerable-card rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 h-48 rounded-md mb-4 flex items-center justify-center">
                  <Package className="h-16 w-16 text-purple-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-purple-600">
                    ${product.price}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">(4.0)</span>
                  </div>
                </div>
                
                <button className="w-full mt-4 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Security Notice */}
      <section className="vulnerable-card rounded-xl p-8 bg-red-50 border border-red-200">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-500 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Security Testing Environment
            </h3>
            <p className="text-red-700 mb-4">
              This application is designed for security testing and contains intentional vulnerabilities. 
              All activities are monitored and logged for educational purposes.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/dashboard"
                className="text-red-600 hover:text-red-800 font-medium"
              >
                View Security Dashboard →
              </Link>
              <Link
                to="/dashboard/live"
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Live Attack Monitoring →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
