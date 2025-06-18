/**
 * 推荐算法工具类
 * 提供基于元路径增强视图的分层对比学习推荐算法的前端调用接口
 */

class RecommendationUtils {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
  }

  /**
   * 获取个性化推荐
   * @param {string} userId - 用户ID
   * @param {Object} options - 推荐选项
   * @returns {Promise<Array>} 推荐结果
   */
  async getPersonalizedRecommendations(userId, options = {}) {
    const {
      topK = 10,
      location = null,
      radius = 5000,
      useCache = true
    } = options

    // 检查缓存
    const cacheKey = this.generateCacheKey(userId, options)
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    try {
      const result = await wx.cloud.callFunction({
        name: 'metapath_recommendation',
        data: {
          userId,
          location,
          topK,
          radius
        }
      })

      if (result.result && result.result.code === 200) {
        const recommendations = result.result.data.recommendations
        
        // 缓存结果
        if (useCache) {
          this.cache.set(cacheKey, {
            data: recommendations,
            timestamp: Date.now()
          })
        }

        return recommendations
      } else {
        throw new Error(result.result?.error || '推荐算法执行失败')
      }
    } catch (error) {
      console.error('获取个性化推荐失败:', error)
      throw error
    }
  }

  /**
   * 获取附近推荐
   * @param {Object} location - 位置信息
   * @param {Object} options - 推荐选项
   * @returns {Promise<Array>} 推荐结果
   */
  async getNearbyRecommendations(location, options = {}) {
    const {
      topK = 20,
      radius = 5000,
      userId = null
    } = options

    try {
      const result = await wx.cloud.callFunction({
        name: 'metapath_recommendation',
        data: {
          userId,
          location,
          topK,
          radius,
          type: 'nearby'
        }
      })

      if (result.result && result.result.code === 200) {
        return result.result.data.recommendations
      } else {
        throw new Error(result.result?.error || '附近推荐获取失败')
      }
    } catch (error) {
      console.error('获取附近推荐失败:', error)
      throw error
    }
  }

  /**
   * 获取热门推荐
   * @param {Object} options - 推荐选项
   * @returns {Promise<Array>} 推荐结果
   */
  async getPopularRecommendations(options = {}) {
    const {
      topK = 10,
      location = null,
      radius = 5000
    } = options

    try {
      const result = await wx.cloud.callFunction({
        name: 'metapath_recommendation',
        data: {
          topK,
          location,
          radius,
          type: 'popular'
        }
      })

      if (result.result && result.result.code === 200) {
        return result.result.data.recommendations
      } else {
        throw new Error(result.result?.error || '热门推荐获取失败')
      }
    } catch (error) {
      console.error('获取热门推荐失败:', error)
      throw error
    }
  }

  /**
   * 获取基于类别的推荐
   * @param {string} category - 兴趣点类别
   * @param {Object} options - 推荐选项
   * @returns {Promise<Array>} 推荐结果
   */
  async getCategoryRecommendations(category, options = {}) {
    const {
      topK = 10,
      location = null,
      radius = 5000,
      userId = null
    } = options

    try {
      const result = await wx.cloud.callFunction({
        name: 'metapath_recommendation',
        data: {
          userId,
          location,
          topK,
          radius,
          category,
          type: 'category'
        }
      })

      if (result.result && result.result.code === 200) {
        return result.result.data.recommendations
      } else {
        throw new Error(result.result?.error || '类别推荐获取失败')
      }
    } catch (error) {
      console.error('获取类别推荐失败:', error)
      throw error
    }
  }

  /**
   * 获取相似用户推荐
   * @param {string} userId - 用户ID
   * @param {Object} options - 推荐选项
   * @returns {Promise<Array>} 推荐结果
   */
  async getSimilarUserRecommendations(userId, options = {}) {
    const {
      topK = 10,
      location = null,
      radius = 5000
    } = options

    try {
      const result = await wx.cloud.callFunction({
        name: 'metapath_recommendation',
        data: {
          userId,
          location,
          topK,
          radius,
          type: 'similar_user'
        }
      })

      if (result.result && result.result.code === 200) {
        return result.result.data.recommendations
      } else {
        throw new Error(result.result?.error || '相似用户推荐获取失败')
      }
    } catch (error) {
      console.error('获取相似用户推荐失败:', error)
      throw error
    }
  }

  /**
   * 更新用户偏好
   * @param {string} userId - 用户ID
   * @param {Array} preferences - 用户偏好
   * @returns {Promise<boolean>} 更新结果
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const db = wx.cloud.database()
      await db.collection('user').doc(userId).update({
        data: {
          like: preferences,
          updateTime: Date.now()
        }
      })

      // 清除相关缓存
      this.clearUserCache(userId)
      
      return true
    } catch (error) {
      console.error('更新用户偏好失败:', error)
      throw error
    }
  }

  /**
   * 添加用户评分
   * @param {string} userId - 用户ID
   * @param {string} placeId - 兴趣点ID
   * @param {number} rating - 评分
   * @param {string} comment - 评论
   * @returns {Promise<boolean>} 添加结果
   */
  async addUserRating(userId, placeId, rating, comment = '') {
    try {
      const db = wx.cloud.database()
      await db.collection('ratings').add({
        data: {
          userId,
          placeId,
          rating,
          comment,
          createTime: Date.now()
        }
      })

      // 清除相关缓存
      this.clearUserCache(userId)
      
      return true
    } catch (error) {
      console.error('添加用户评分失败:', error)
      throw error
    }
  }

  /**
   * 获取推荐解释
   * @param {string} userId - 用户ID
   * @param {string} placeId - 兴趣点ID
   * @returns {Promise<Object>} 推荐解释
   */
  async getRecommendationExplanation(userId, placeId) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'metapath_recommendation',
        data: {
          userId,
          placeId,
          type: 'explanation'
        }
      })

      if (result.result && result.result.code === 200) {
        return result.result.data.explanation
      } else {
        throw new Error(result.result?.error || '获取推荐解释失败')
      }
    } catch (error) {
      console.error('获取推荐解释失败:', error)
      throw error
    }
  }

  /**
   * 生成缓存键
   * @param {string} userId - 用户ID
   * @param {Object} options - 选项
   * @returns {string} 缓存键
   */
  generateCacheKey(userId, options) {
    const key = {
      userId,
      ...options
    }
    return JSON.stringify(key)
  }

  /**
   * 清除用户相关缓存
   * @param {string} userId - 用户ID
   */
  clearUserCache(userId) {
    const keysToDelete = []
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(userId)) {
        keysToDelete.push(key)
      }
    }
    
    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    this.cache.clear()
  }

  /**
   * 获取推荐算法信息
   * @returns {Object} 算法信息
   */
  getAlgorithmInfo() {
    return {
      name: 'MetaPathEnhancedContrastiveLearning',
      description: '基于元路径增强视图的分层对比学习推荐算法',
      features: [
        '元路径增强视图构建',
        '三阶段注意力机制',
        '协同正样本选择策略',
        '分层对比学习',
        '异构信息网络建模'
      ],
      advantages: [
        '更有效的捕获异质信息网络中多层次的信息',
        '结合结构语义和特征语义的协同正样本选择',
        '多层次的对比学习提高推荐准确性',
        '适用于位置社会网络中的无监督兴趣点推荐任务'
      ]
    }
  }

  /**
   * 格式化推荐结果
   * @param {Array} recommendations - 推荐结果
   * @returns {Array} 格式化后的推荐结果
   */
  formatRecommendations(recommendations) {
    return recommendations.map(item => ({
      id: item.placeId,
      name: item.name,
      category: item.category,
      location: item.location,
      similarity: item.similarity,
      distance: item.distance,
      rating: item.rating,
      ratingCount: item.ratingCount,
      tags: item.tags || [],
      description: item.description || '',
      images: item.images || []
    }))
  }

  /**
   * 计算推荐多样性
   * @param {Array} recommendations - 推荐结果
   * @returns {number} 多样性分数
   */
  calculateDiversity(recommendations) {
    if (recommendations.length <= 1) return 1.0
    
    let totalDistance = 0
    let count = 0
    
    for (let i = 0; i < recommendations.length; i++) {
      for (let j = i + 1; j < recommendations.length; j++) {
        const distance = this.calculateItemDistance(recommendations[i], recommendations[j])
        totalDistance += distance
        count++
      }
    }
    
    return count > 0 ? totalDistance / count : 0
  }

  /**
   * 计算两个推荐项目之间的距离
   * @param {Object} item1 - 推荐项目1
   * @param {Object} item2 - 推荐项目2
   * @returns {number} 距离
   */
  calculateItemDistance(item1, item2) {
    let distance = 0
    
    // 类别距离
    if (item1.category !== item2.category) {
      distance += 1.0
    }
    
    // 地理位置距离
    if (item1.location && item2.location) {
      const geoDistance = this.calculateGeoDistance(
        item1.location.latitude,
        item1.location.longitude,
        item2.location.latitude,
        item2.location.longitude
      )
      distance += Math.min(geoDistance / 10000, 1.0) // 归一化到10km
    }
    
    // 标签距离
    const tags1 = new Set(item1.tags || [])
    const tags2 = new Set(item2.tags || [])
    const intersection = new Set([...tags1].filter(x => tags2.has(x)))
    const union = new Set([...tags1, ...tags2])
    const tagSimilarity = union.size > 0 ? intersection.size / union.size : 0
    distance += (1 - tagSimilarity)
    
    return distance / 3.0 // 归一化
  }

  /**
   * 计算地理距离
   * @param {number} lat1 - 纬度1
   * @param {number} lon1 - 经度1
   * @param {number} lat2 - 纬度2
   * @param {number} lon2 - 经度2
   * @returns {number} 距离（米）
   */
  calculateGeoDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000 // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
}

// 导出工具类实例
const recommendationUtils = new RecommendationUtils()

module.exports = recommendationUtils 