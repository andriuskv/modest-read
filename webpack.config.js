const path = require("path");
const { DefinePlugin } = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const workboxPlugin = require("workbox-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = function(env = {}) {
  const mode = env.prod ? "production" : "development";
  const plugins = [
    new DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(mode),
        SERVER_URL: JSON.stringify(process.env.SERVER_URL)
      }
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css"
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      minify: env.prod ? {
        keepClosingSlash: true,
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
        minifyCSS: true
      } : undefined
    }),
    new CopyPlugin({ patterns: [
      { from: "./src/assets", to: "./assets" },
      { from: "./public", globOptions: {
        ignore: ["**/index.html"]
      }}
    ]})
  ];

  if (env.prod) {
    plugins.push(new workboxPlugin.GenerateSW({
      swDest: "./sw.js",
      skipWaiting: true,
      clientsClaim: true,
      disableDevLogs: true
    }));
  }

  return {
    devServer: {
      static: {
        directory: path.join(__dirname, "public")
      },
      client: {
        logging: "error"
      },
      open: true,
      hot: false,
      compress: true,
      port: 3000,
      proxy: {
        "/api": "http://localhost:9000"
      }
    },
    mode,
    target: "browserslist",
    entry: {
      main: "./src/index.js"
    },
    resolve: {
      alias: {
        components: path.resolve(__dirname, "src/components"),
        contexts: path.resolve(__dirname, "src/contexts"),
        services: path.resolve(__dirname, "src/services")
      }
    },
    output: {
      path: path.resolve(__dirname, "./build"),
      filename: "[name].js"
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /node_modules/,
            name: "vendor",
            chunks: "initial"
          }
        }
      },
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            ecma: 2021,
            output: {
              comments: false
            }
          }
        }),
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              "default",
              { discardComments: { removeAll: true } }
            ]
          }
        })
      ]
    },
    module: {
      rules: [
        {
          test: /\.(png|svg)$/i,
          type: "asset/resource"
        },
        {
          test: /\.s?css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: true
              }
            },
            {
              loader: "css-loader",
              options: {
                sourceMap: !env.prod,
                url: false
              }
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: !env.prod
              }
            }
          ]
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [["@babel/preset-env", {
                modules: false,
                loose: true,
                bugfixes: true,
                useBuiltIns: "usage",
                corejs: 3
              }], ["@babel/preset-react", {
                runtime: "automatic"
              }]]
            }
          }
        }
      ]
    },
    devtool: env.prod ? false : "inline-source-map",
    plugins,
    stats: {
      entrypoints: false,
      children: false
    }
  };
};
