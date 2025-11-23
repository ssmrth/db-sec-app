import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Package } from 'lucide-react';
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

  const features = [
    {
      title: "User Authentication",
      description: "Secure login system with personalized experience",
      action: "Sign In",
      link: "/vulnerable/login"
    },
    {
      title: "User Profiles",
      description: "Manage your account and view order history",
      action: "View Profile",
      link: "/vulnerable/profile"
    },
    {
      title: "Smart Search",
      description: "Find products quickly with our advanced search",
      action: "Search Products",
      link: "/vulnerable/search"
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
          Your premium e-commerce destination for quality products
        </p>
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            to="/vulnerable/products"
            className="bg-thunderlarra text-white px-6 py-3 rounded-lg hover:bg-thunderlarra-dark transition-colors"
          >
            Browse Products
          </Link>
          <Link
            to="/dashboard"
            className="bg-aged-jade text-white px-6 py-3 rounded-lg hover:bg-aged-jade-dark transition-colors"
          >
            Analytics Dashboard
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          ✨ Explore Our Features
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="vulnerable-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {feature.description}
              </p>
              <Link
                to={feature.link}
                className="inline-block bg-thunderlarra text-white px-4 py-2 rounded-md hover:bg-thunderlarra-dark transition-colors"
              >
                {feature.action}
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
            className="text-thunderlarra hover:text-thunderlarra-dark font-medium"
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
                <div className="bg-gradient-to-br from-aged-jade-light to-thunderlarra-light h-48 rounded-md mb-4 flex items-center justify-center">
                  <Package className="h-16 w-16 text-aged-jade" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-thunderlarra">
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
                
                <button className="w-full mt-4 bg-thunderlarra text-white py-2 rounded-md hover:bg-thunderlarra-dark transition-colors flex items-center justify-center space-x-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;

