#include<iostream>
#include <emscripten/bind.h>
#include <string>
#include <sstream>
#include <iostream>
#include <map>
#include <vector>

using namespace emscripten;

std::vector<size_t> split(const std::string& s, char delimiter)
{
   std::vector<size_t> tokens;
   std::string token;
   std::istringstream tokenStream(s);

   while (std::getline(tokenStream, token, delimiter))
   {
      tokens.push_back(std::stoi(token));
   }
   return tokens;
}

float dot(std::vector<float> &A, std::vector<float> &B)
{
  if(A.size() != B.size())
  {
    // Raise error?
    return -1;
  }
  float product = 0;
  for(size_t idx = 0; idx < A.size(); idx++)
  {
    product = product + A[idx] * B[idx];
  }
  return product;
}

std::vector<float> getRow(std::vector<float> &A, size_t featureCount, size_t row)
{
  std::vector<float>::const_iterator first = A.begin() + row;
  std::vector<float>::const_iterator last = A.begin() + row + featureCount;
  std::vector<float> newVec(first, last);
  return newVec;
}

std::map<std::string, float> returnMapData () {
    std::map<std::string, float> m;
    return m;
}
std::vector<float> returnVector () {
  std::vector<float> v;
  return v;
}

void printMap(std::map<std::string, float> data)
{
    for( auto const& [key, val] : data)
    {
        std::cout << key << ", " << val << "\n";
    }
}

size_t getIdx(size_t x, size_t y, size_t size_x, size_t size_y)
{
  return x * size_y + y;
}

void computeUpdates(std::map<std::string, float> &data, std::vector<float> &W, std::vector<float> &H, size_t userCount, size_t movieCount, size_t featureCount) {
    float learningRate = 0.002;
    float beta = 0.02;
    // std::cout << "Data:" << data.size() << "\n";

    for( auto const& [key, val] : data)
    {
        // std::cout << "Iterating over datapoint:" << key << ", " << val << std::endl;

        std::vector<size_t> keys = split(key, ',');
        size_t const user = keys[0];
        size_t const movie = keys[1];
        float const rating = val;

        auto rowW = getRow(W, featureCount, getIdx(user, 0, userCount, featureCount));
        auto rowH = getRow(H, featureCount, getIdx(movie, 0, movieCount, featureCount));
        // std::cout << "RowSizeW: " << rowW.size() << std::endl;
        // std::cout << "RowSizeH: " << rowH.size() << std::endl;

        float predictedRating = dot(rowH, rowW);
        float error = rating - predictedRating;

        // std::cout << "Error:" << error << std::endl;

        // for(size_t idx = 0; idx < rowH.size(); idx++)
        // {
        // std::cout << "Pred rating: " << predictedRating << ",\trating: " << rating << std::endl;
        // }


        // std::cout << "Error:" << error << std::endl;

        // asf
        for(size_t idx_f = 0; idx_f < featureCount; idx_f++)
        {
          float updatedW = W[getIdx(user, idx_f, userCount, featureCount)] +
            learningRate * (2.0f * error * H[getIdx(movie, idx_f, movieCount, featureCount)] - beta * W[getIdx(user, idx_f, userCount, featureCount)]);
          W[getIdx(user, idx_f, userCount, featureCount)] = updatedW;

          float updatedH = H[getIdx(movie, idx_f, movieCount, featureCount)] +
            learningRate * (2.0f * error * W[getIdx(user, idx_f, userCount, featureCount)] - beta * H[getIdx(movie, idx_f, movieCount, featureCount)]);
          H[getIdx(movie, idx_f, movieCount, featureCount)] = updatedH;
        }
    }
}

EMSCRIPTEN_BINDINGS(my_module) {
    function("returnMapData", &returnMapData);
    function("returnVector", &returnVector);
    function("printMap", &printMap);

    function("computeUpdates", &computeUpdates);

    register_vector<float>("VectorFloat");
    register_map<std::string, float>("map<std::string, float>");
}