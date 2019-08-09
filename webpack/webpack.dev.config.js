const webpack = require("webpack");
const path = require("path");
const merge = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const getCommonConfig = require("./webpack.common");

module.exports = (env) => merge(getCommonConfig(env), {
    mode: "development",
    devtool: "eval",
    optimization: {
        splitChunks: {
            chunks: "all"
        }
    },
    devServer: {
        contentBase: path.resolve(__dirname, "public"),
        host: "0.0.0.0", // this allows VMs to access the server
        port: 3000,
        disableHostCheck: true
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    { loader: "css-loader", options: { url: true, sourceMap: true } },
                    {
                        loader: "sass-loader",
                        options: {
                            url: false,
                            sourceMap: true,
                            includePaths: ["./src/_scss", "./node_modules"]
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                API: process.env.API
                    ? JSON.stringify(process.env.API)
                    : JSON.stringify("http://localhost:9999/v1/current_user/"),
                API_CALLBACK: process.env.API_CALLBACK
                    ? JSON.stringify(process.env.API_CALLBACK)
                    : JSON.stringify("http://localhost:3000/#/auth"),
                GA_TRACKING_ID: process.env.GA_TRACKING_ID
                    ? JSON.stringify(process.env.GA_TRACKING_ID)
                    : JSON.stringify(""),
                CAS_ROOT: JSON.stringify("https://login.test.max.gov"),
                IS_DEV: JSON.stringify('true')
            }
        })
    ]
});
