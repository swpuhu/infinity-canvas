const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    experimentalInlineMatchResource: true,
                },
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            esModule: false,
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.vue'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        fallback: {
            path: false,
            fs: false,
        },
    },
    plugins: [new VueLoaderPlugin()],
    experiments: {
        css: true,
    },
    builtins: {
        html: [
            {
                template: './index.html',
            },
        ],
    },
    optimization: {
        moduleIds: 'named',
    },
};
