npm run build:babel
npm run build:demo

rm -r ./gh-pages
mkdir gh-pages

cp README.md gh-pages/README.md
cp package.json gh-pages/package.json
cp -r demo gh-pages/demo
cp -r lib gh-pages/lib

rm -r ./gh-pages/demo/src

gh-pages -d gh-pages
