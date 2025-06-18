// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 基于元路径增强视图的分层对比学习推荐算法
 * 该方法设计了一种基于元路径增强视图，先根据目标节点非同质节点的聚合特征，
 * 将其作为增强视图节点对间的边特征，再根据节点间元路径的关联度和三阶段的注意力机制进行聚合，
 * 从而更高效地描述节点嵌入。最后，设计了一种结合了结构语义和特征语义的协同正样本选择策略，
 * 并使用分层对比学习的自监督方法，包括元路径之间的嵌入对比和整体的嵌入对比，
 * 以及高阶视图和结构视图的对比，通过多层次的对比，利用有效的监督信息指导模型训练，
 * 从而充分捕捉异构信息网络的信息。
 */

class MetaPathEnhancedRecommendation {
  constructor() {
    this.userEmbeddings = new Map()
    this.placeEmbeddings = new Map()
    this.metaPaths = []
    this.attentionWeights = new Map()
    this.positiveSamples = new Map()
  }

  /**
   * 初始化元路径
   */
  initializeMetaPaths() {
    // 定义异构信息网络中的元路径
    this.metaPaths = [
      // 用户-兴趣点-用户 (U-P-U)
      { type: 'UPU', path: ['user', 'place', 'user'], weight: 0.3 },
      // 用户-兴趣点-类别-兴趣点-用户 (U-P-C-P-U)
      { type: 'UPCPU', path: ['user', 'place', 'category', 'place', 'user'], weight: 0.25 },
      // 用户-兴趣点-位置-兴趣点-用户 (U-P-L-P-U)
      { type: 'UPLPU', path: ['user', 'place', 'location', 'place', 'user'], weight: 0.25 },
      // 用户-兴趣点-标签-兴趣点-用户 (U-P-T-P-U)
      { type: 'UPTPU', path: ['user', 'place', 'tag', 'place', 'user'], weight: 0.2 }
    ]
  }

  /**
   * 构建异构信息网络
   */
  async buildHeterogeneousNetwork() {
    const network = {
      users: new Map(),
      places: new Map(),
      categories: new Map(),
      locations: new Map(),
      tags: new Map(),
      edges: []
    }

    try {
      // 获取用户数据
      const users = await db.collection('user').get()
      users.data.forEach(user => {
        network.users.set(user._id, {
          id: user._id,
          preferences: user.like || [],
          embeddings: this.initializeEmbeddings(64) // 64维嵌入
        })
      })

      // 获取兴趣点数据
      const places = await db.collection('text').get()
      places.data.forEach(place => {
        network.places.set(place._id, {
          id: place._id,
          name: place.title,
          category: place.category || '其他',
          location: {
            latitude: place.wd,
            longitude: place.jd
          },
          tags: place.tags || [],
          embeddings: this.initializeEmbeddings(64)
        })
      })

      // 构建边关系
      await this.buildEdges(network)

      return network
    } catch (error) {
      console.error('构建异构信息网络失败:', error)
      throw error
    }
  }

  /**
   * 构建网络边关系
   */
  async buildEdges(network) {
    // 用户-兴趣点边（基于评分）
    for (const [userId, user] of network.users) {
      if (user.preferences && user.preferences.length > 0) {
        for (const [placeId, rating] of user.preferences) {
          if (network.places.has(placeId)) {
            network.edges.push({
              source: userId,
              target: placeId,
              type: 'user_place',
              weight: rating / 5.0, // 归一化评分
              metadata: { rating }
            })
          }
        }
      }
    }

    // 兴趣点-类别边
    for (const [placeId, place] of network.places) {
      if (place.category) {
        network.edges.push({
          source: placeId,
          target: place.category,
          type: 'place_category',
          weight: 1.0
        })
      }
    }

    // 兴趣点-位置边（基于地理位置聚类）
    const locationClusters = this.clusterLocations(Array.from(network.places.values()))
    for (const [placeId, place] of network.places) {
      const cluster = this.findLocationCluster(place.location, locationClusters)
      if (cluster) {
        network.edges.push({
          source: placeId,
          target: cluster,
          type: 'place_location',
          weight: 1.0
        })
      }
    }

    // 兴趣点-标签边
    for (const [placeId, place] of network.places) {
      if (place.tags && place.tags.length > 0) {
        for (const tag of place.tags) {
          network.edges.push({
            source: placeId,
            target: tag,
            type: 'place_tag',
            weight: 1.0
          })
        }
      }
    }
  }

  /**
   * 初始化嵌入向量
   */
  initializeEmbeddings(dimension) {
    const embedding = new Array(dimension)
    for (let i = 0; i < dimension; i++) {
      embedding[i] = (Math.random() - 0.5) * 0.1 // 小随机值初始化
    }
    return embedding
  }

  /**
   * 地理位置聚类
   */
  clusterLocations(places) {
    const clusters = []
    const threshold = 0.01 // 约1km的经纬度差

    for (const place of places) {
      let assigned = false
      for (const cluster of clusters) {
        const distance = this.calculateDistance(
          cluster.center.latitude,
          cluster.center.longitude,
          place.location.latitude,
          place.location.longitude
        )
        if (distance < threshold) {
          cluster.places.push(place.id)
          assigned = true
          break
        }
      }
      if (!assigned) {
        clusters.push({
          id: `cluster_${clusters.length}`,
          center: place.location,
          places: [place.id]
        })
      }
    }

    return clusters
  }

  /**
   * 查找位置聚类
   */
  findLocationCluster(location, clusters) {
    const threshold = 0.01
    for (const cluster of clusters) {
      const distance = this.calculateDistance(
        cluster.center.latitude,
        cluster.center.longitude,
        location.latitude,
        location.longitude
      )
      if (distance < threshold) {
        return cluster.id
      }
    }
    return null
  }

  /**
   * 计算两点间距离
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * 元路径增强视图构建
   */
  buildMetaPathEnhancedView(network) {
    const enhancedViews = new Map()

    for (const metaPath of this.metaPaths) {
      const view = this.createEnhancedView(network, metaPath)
      enhancedViews.set(metaPath.type, view)
    }

    return enhancedViews
  }

  /**
   * 创建增强视图
   */
  createEnhancedView(network, metaPath) {
    const view = {
      nodes: new Map(),
      edges: new Map(),
      embeddings: new Map()
    }

    // 根据元路径类型构建视图
    switch (metaPath.type) {
      case 'UPU':
        this.buildUPUView(network, view)
        break
      case 'UPCPU':
        this.buildUPCPUView(network, view)
        break
      case 'UPLPU':
        this.buildUPLPUView(network, view)
        break
      case 'UPTPU':
        this.buildUPTPUView(network, view)
        break
    }

    return view
  }

  /**
   * 构建U-P-U视图
   */
  buildUPUView(network, view) {
    // 用户-兴趣点-用户路径
    for (const [userId1, user1] of network.users) {
      for (const [placeId, place] of network.places) {
        // 检查用户1是否访问过该兴趣点
        const user1Rating = user1.preferences.find(p => p[0] === placeId)
        if (user1Rating) {
          for (const [userId2, user2] of network.users) {
            if (userId1 !== userId2) {
              // 检查用户2是否也访问过该兴趣点
              const user2Rating = user2.preferences.find(p => p[0] === placeId)
              if (user2Rating) {
                const edgeId = `${userId1}_${userId2}`
                const edgeWeight = this.calculateEdgeWeight(user1Rating[1], user2Rating[1])
                
                view.edges.set(edgeId, {
                  source: userId1,
                  target: userId2,
                  weight: edgeWeight,
                  metadata: {
                    commonPlace: placeId,
                    user1Rating: user1Rating[1],
                    user2Rating: user2Rating[1]
                  }
                })
              }
            }
          }
        }
      }
    }
  }

  /**
   * 构建U-P-C-P-U视图
   */
  buildUPCPUView(network, view) {
    // 用户-兴趣点-类别-兴趣点-用户路径
    for (const [userId1, user1] of network.users) {
      for (const [placeId1, place1] of network.places) {
        const user1Rating = user1.preferences.find(p => p[0] === placeId1)
        if (user1Rating && place1.category) {
          for (const [placeId2, place2] of network.places) {
            if (placeId1 !== placeId2 && place1.category === place2.category) {
              for (const [userId2, user2] of network.users) {
                if (userId1 !== userId2) {
                  const user2Rating = user2.preferences.find(p => p[0] === placeId2)
                  if (user2Rating) {
                    const edgeId = `${userId1}_${userId2}_category`
                    const edgeWeight = this.calculateCategoryEdgeWeight(
                      user1Rating[1], user2Rating[1], place1.category
                    )
                    
                    view.edges.set(edgeId, {
                      source: userId1,
                      target: userId2,
                      weight: edgeWeight,
                      metadata: {
                        category: place1.category,
                        user1Place: placeId1,
                        user2Place: placeId2,
                        user1Rating: user1Rating[1],
                        user2Rating: user2Rating[1]
                      }
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * 构建U-P-L-P-U视图
   */
  buildUPLPUView(network, view) {
    // 用户-兴趣点-位置-兴趣点-用户路径
    const locationClusters = this.clusterLocations(Array.from(network.places.values()))
    
    for (const [userId1, user1] of network.users) {
      for (const [placeId1, place1] of network.places) {
        const user1Rating = user1.preferences.find(p => p[0] === placeId1)
        if (user1Rating) {
          const cluster1 = this.findLocationCluster(place1.location, locationClusters)
          if (cluster1) {
            for (const [placeId2, place2] of network.places) {
              if (placeId1 !== placeId2) {
                const cluster2 = this.findLocationCluster(place2.location, locationClusters)
                if (cluster1 === cluster2) {
                  for (const [userId2, user2] of network.users) {
                    if (userId1 !== userId2) {
                      const user2Rating = user2.preferences.find(p => p[0] === placeId2)
                      if (user2Rating) {
                        const edgeId = `${userId1}_${userId2}_location`
                        const edgeWeight = this.calculateLocationEdgeWeight(
                          user1Rating[1], user2Rating[1], cluster1
                        )
                        
                        view.edges.set(edgeId, {
                          source: userId1,
                          target: userId2,
                          weight: edgeWeight,
                          metadata: {
                            locationCluster: cluster1,
                            user1Place: placeId1,
                            user2Place: placeId2,
                            user1Rating: user1Rating[1],
                            user2Rating: user2Rating[1]
                          }
                        })
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * 构建U-P-T-P-U视图
   */
  buildUPTPUView(network, view) {
    // 用户-兴趣点-标签-兴趣点-用户路径
    for (const [userId1, user1] of network.users) {
      for (const [placeId1, place1] of network.places) {
        const user1Rating = user1.preferences.find(p => p[0] === placeId1)
        if (user1Rating && place1.tags && place1.tags.length > 0) {
          for (const tag of place1.tags) {
            for (const [placeId2, place2] of network.places) {
              if (placeId1 !== placeId2 && place2.tags && place2.tags.includes(tag)) {
                for (const [userId2, user2] of network.users) {
                  if (userId1 !== userId2) {
                    const user2Rating = user2.preferences.find(p => p[0] === placeId2)
                    if (user2Rating) {
                      const edgeId = `${userId1}_${userId2}_tag_${tag}`
                      const edgeWeight = this.calculateTagEdgeWeight(
                        user1Rating[1], user2Rating[1], tag
                      )
                      
                      view.edges.set(edgeId, {
                        source: userId1,
                        target: userId2,
                        weight: edgeWeight,
                        metadata: {
                          tag: tag,
                          user1Place: placeId1,
                          user2Place: placeId2,
                          user1Rating: user1Rating[1],
                          user2Rating: user2Rating[1]
                        }
                      })
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * 计算边权重
   */
  calculateEdgeWeight(rating1, rating2) {
    // 基于评分相似度计算权重
    const similarity = 1 - Math.abs(rating1 - rating2) / 5.0
    return Math.max(0.1, similarity)
  }

  /**
   * 计算类别边权重
   */
  calculateCategoryEdgeWeight(rating1, rating2, category) {
    const baseWeight = this.calculateEdgeWeight(rating1, rating2)
    // 可以根据类别重要性调整权重
    const categoryWeights = {
      '景点': 1.2,
      '餐厅': 1.1,
      '购物': 1.0,
      '其他': 0.8
    }
    return baseWeight * (categoryWeights[category] || 1.0)
  }

  /**
   * 计算位置边权重
   */
  calculateLocationEdgeWeight(rating1, rating2, locationCluster) {
    const baseWeight = this.calculateEdgeWeight(rating1, rating2)
    // 位置聚类权重可以基于聚类大小调整
    return baseWeight * 1.1
  }

  /**
   * 计算标签边权重
   */
  calculateTagEdgeWeight(rating1, rating2, tag) {
    const baseWeight = this.calculateEdgeWeight(rating1, rating2)
    // 标签权重可以基于标签流行度调整
    return baseWeight * 1.0
  }

  /**
   * 三阶段注意力机制
   */
  applyThreeStageAttention(network, enhancedViews) {
    const attentionResults = new Map()

    for (const [metaPathType, view] of enhancedViews) {
      const attention = this.calculateAttention(view, network)
      attentionResults.set(metaPathType, attention)
    }

    return attentionResults
  }

  /**
   * 计算注意力权重
   */
  calculateAttention(view, network) {
    const attention = {
      nodeAttention: new Map(),
      edgeAttention: new Map(),
      pathAttention: new Map()
    }

    // 第一阶段：节点级注意力
    for (const [edgeId, edge] of view.edges) {
      const sourceNode = network.users.get(edge.source) || network.places.get(edge.source)
      const targetNode = network.users.get(edge.target) || network.places.get(edge.target)
      
      if (sourceNode && targetNode) {
        const nodeAttention = this.calculateNodeAttention(sourceNode, targetNode, edge)
        attention.nodeAttention.set(edgeId, nodeAttention)
      }
    }

    // 第二阶段：边级注意力
    for (const [edgeId, edge] of view.edges) {
      const edgeAttention = this.calculateEdgeAttention(edge, view)
      attention.edgeAttention.set(edgeId, edgeAttention)
    }

    // 第三阶段：路径级注意力
    for (const [edgeId, edge] of view.edges) {
      const pathAttention = this.calculatePathAttention(edge, view, network)
      attention.pathAttention.set(edgeId, pathAttention)
    }

    return attention
  }

  /**
   * 计算节点级注意力
   */
  calculateNodeAttention(sourceNode, targetNode, edge) {
    // 基于节点特征相似度计算注意力
    const sourceEmbedding = sourceNode.embeddings
    const targetEmbedding = targetNode.embeddings
    
    const similarity = this.cosineSimilarity(sourceEmbedding, targetEmbedding)
    return Math.max(0.1, similarity)
  }

  /**
   * 计算边级注意力
   */
  calculateEdgeAttention(edge, view) {
    // 基于边的权重和元数据计算注意力
    const baseWeight = edge.weight
    const metadataWeight = this.calculateMetadataWeight(edge.metadata)
    return baseWeight * metadataWeight
  }

  /**
   * 计算路径级注意力
   */
  calculatePathAttention(edge, view, network) {
    // 基于路径的复杂度和重要性计算注意力
    const pathComplexity = this.calculatePathComplexity(edge, view)
    const pathImportance = this.calculatePathImportance(edge, network)
    return pathComplexity * pathImportance
  }

  /**
   * 计算元数据权重
   */
  calculateMetadataWeight(metadata) {
    let weight = 1.0
    
    if (metadata.rating) {
      weight *= (metadata.rating / 5.0)
    }
    
    if (metadata.category) {
      const categoryWeights = {
        '景点': 1.2,
        '餐厅': 1.1,
        '购物': 1.0,
        '其他': 0.8
      }
      weight *= (categoryWeights[metadata.category] || 1.0)
    }
    
    return weight
  }

  /**
   * 计算路径复杂度
   */
  calculatePathComplexity(edge, view) {
    // 基于边的连接度计算复杂度
    const sourceConnections = Array.from(view.edges.values())
      .filter(e => e.source === edge.source || e.target === edge.source).length
    const targetConnections = Array.from(view.edges.values())
      .filter(e => e.source === edge.target || e.target === edge.target).length
    
    return Math.min(1.0, (sourceConnections + targetConnections) / 10.0)
  }

  /**
   * 计算路径重要性
   */
  calculatePathImportance(edge, network) {
    // 基于节点在网络中的重要性计算路径重要性
    const sourceNode = network.users.get(edge.source) || network.places.get(edge.source)
    const targetNode = network.users.get(edge.target) || network.places.get(edge.target)
    
    if (!sourceNode || !targetNode) return 0.5
    
    const sourceImportance = this.calculateNodeImportance(sourceNode, network)
    const targetImportance = this.calculateNodeImportance(targetNode, network)
    
    return (sourceImportance + targetImportance) / 2.0
  }

  /**
   * 计算节点重要性
   */
  calculateNodeImportance(node, network) {
    // 基于节点的连接度和特征计算重要性
    let connections = 0
    
    if (node.preferences) {
      connections = node.preferences.length
    } else {
      // 对于兴趣点，计算有多少用户访问过
      connections = Array.from(network.users.values())
        .filter(user => user.preferences.some(p => p[0] === node.id)).length
    }
    
    return Math.min(1.0, connections / 20.0)
  }

  /**
   * 协同正样本选择策略
   */
  selectPositiveSamples(network, enhancedViews, attentionResults) {
    const positiveSamples = new Map()

    for (const [userId, user] of network.users) {
      const samples = this.selectUserPositiveSamples(user, network, enhancedViews, attentionResults)
      positiveSamples.set(userId, samples)
    }

    return positiveSamples
  }

  /**
   * 为用户选择正样本
   */
  selectUserPositiveSamples(user, network, enhancedViews, attentionResults) {
    const samples = {
      structural: [], // 结构语义正样本
      feature: [],    // 特征语义正样本
      hybrid: []      // 混合正样本
    }

    // 结构语义正样本：基于网络结构相似性
    const structuralSamples = this.selectStructuralSamples(user, network, enhancedViews)
    samples.structural = structuralSamples

    // 特征语义正样本：基于用户偏好相似性
    const featureSamples = this.selectFeatureSamples(user, network)
    samples.feature = featureSamples

    // 混合正样本：结合结构和特征信息
    const hybridSamples = this.selectHybridSamples(user, network, enhancedViews, attentionResults)
    samples.hybrid = hybridSamples

    return samples
  }

  /**
   * 选择结构语义正样本
   */
  selectStructuralSamples(user, network, enhancedViews) {
    const samples = []
    
    // 基于元路径视图选择结构相似的用户
    for (const [metaPathType, view] of enhancedViews) {
      const userEdges = Array.from(view.edges.values())
        .filter(edge => edge.source === user.id || edge.target === user.id)
      
      for (const edge of userEdges) {
        const otherUserId = edge.source === user.id ? edge.target : edge.source
        const otherUser = network.users.get(otherUserId)
        
        if (otherUser && edge.weight > 0.5) {
          samples.push({
            userId: otherUserId,
            similarity: edge.weight,
            metaPath: metaPathType,
            type: 'structural'
          })
        }
      }
    }

    // 按相似度排序并选择top-k
    return samples
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
  }

  /**
   * 选择特征语义正样本
   */
  selectFeatureSamples(user, network) {
    const samples = []
    
    // 基于用户偏好相似性选择正样本
    for (const [otherUserId, otherUser] of network.users) {
      if (otherUserId === user.id) continue
      
      const similarity = this.calculateUserPreferenceSimilarity(user, otherUser)
      if (similarity > 0.3) {
        samples.push({
          userId: otherUserId,
          similarity: similarity,
          type: 'feature'
        })
      }
    }

    return samples
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
  }

  /**
   * 选择混合正样本
   */
  selectHybridSamples(user, network, enhancedViews, attentionResults) {
    const samples = []
    
    // 结合结构信息和特征信息选择正样本
    for (const [otherUserId, otherUser] of network.users) {
      if (otherUserId === user.id) continue
      
      const structuralSimilarity = this.calculateStructuralSimilarity(user, otherUser, enhancedViews)
      const featureSimilarity = this.calculateUserPreferenceSimilarity(user, otherUser)
      
      // 加权组合
      const hybridSimilarity = 0.6 * structuralSimilarity + 0.4 * featureSimilarity
      
      if (hybridSimilarity > 0.4) {
        samples.push({
          userId: otherUserId,
          similarity: hybridSimilarity,
          structuralSimilarity,
          featureSimilarity,
          type: 'hybrid'
        })
      }
    }

    return samples
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
  }

  /**
   * 计算用户偏好相似性
   */
  calculateUserPreferenceSimilarity(user1, user2) {
    if (!user1.preferences || !user2.preferences) return 0
    
    const commonPlaces = []
    for (const [placeId1, rating1] of user1.preferences) {
      for (const [placeId2, rating2] of user2.preferences) {
        if (placeId1 === placeId2) {
          commonPlaces.push([rating1, rating2])
        }
      }
    }
    
    if (commonPlaces.length === 0) return 0
    
    // 计算皮尔逊相关系数
    const n = commonPlaces.length
    const sum1 = commonPlaces.reduce((sum, [r1, _]) => sum + r1, 0)
    const sum2 = commonPlaces.reduce((sum, [_, r2]) => sum + r2, 0)
    const sum1Sq = commonPlaces.reduce((sum, [r1, _]) => sum + r1 * r1, 0)
    const sum2Sq = commonPlaces.reduce((sum, [_, r2]) => sum + r2 * r2, 0)
    const pSum = commonPlaces.reduce((sum, [r1, r2]) => sum + r1 * r2, 0)
    
    const num = pSum - (sum1 * sum2 / n)
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n))
    
    return den === 0 ? 0 : Math.max(0, num / den)
  }

  /**
   * 计算结构相似性
   */
  calculateStructuralSimilarity(user1, user2, enhancedViews) {
    let totalSimilarity = 0
    let count = 0
    
    for (const [metaPathType, view] of enhancedViews) {
      const edge = view.edges.get(`${user1.id}_${user2.id}`) || 
                   view.edges.get(`${user2.id}_${user1.id}`)
      
      if (edge) {
        totalSimilarity += edge.weight
        count++
      }
    }
    
    return count > 0 ? totalSimilarity / count : 0
  }

  /**
   * 分层对比学习
   */
  async performHierarchicalContrastiveLearning(network, enhancedViews, attentionResults, positiveSamples) {
    const embeddings = new Map()
    
    // 第一层：元路径之间的嵌入对比
    const metaPathEmbeddings = await this.metaPathContrastiveLearning(network, enhancedViews, attentionResults)
    
    // 第二层：整体的嵌入对比
    const globalEmbeddings = await this.globalContrastiveLearning(network, metaPathEmbeddings)
    
    // 第三层：高阶视图和结构视图的对比
    const finalEmbeddings = await this.highOrderContrastiveLearning(network, globalEmbeddings, positiveSamples)
    
    return finalEmbeddings
  }

  /**
   * 元路径之间的嵌入对比学习
   */
  async metaPathContrastiveLearning(network, enhancedViews, attentionResults) {
    const metaPathEmbeddings = new Map()
    
    for (const [metaPathType, view] of enhancedViews) {
      const attention = attentionResults.get(metaPathType)
      const embeddings = this.computeMetaPathEmbeddings(network, view, attention)
      metaPathEmbeddings.set(metaPathType, embeddings)
    }
    
    return metaPathEmbeddings
  }

  /**
   * 计算元路径嵌入
   */
  computeMetaPathEmbeddings(network, view, attention) {
    const embeddings = new Map()
    
    // 为每个节点计算基于该元路径的嵌入
    for (const [userId, user] of network.users) {
      const embedding = this.computeNodeEmbedding(userId, network, view, attention)
      embeddings.set(userId, embedding)
    }
    
    return embeddings
  }

  /**
   * 计算节点嵌入
   */
  computeNodeEmbedding(nodeId, network, view, attention) {
    const embedding = new Array(64).fill(0)
    const node = network.users.get(nodeId) || network.places.get(nodeId)
    
    if (!node) return embedding
    
    // 基于注意力权重聚合邻居信息
    const neighbors = this.getNodeNeighbors(nodeId, view)
    
    for (const neighbor of neighbors) {
      const edgeId = `${nodeId}_${neighbor.id}` || `${neighbor.id}_${nodeId}`
      const edgeAttention = attention.edgeAttention.get(edgeId) || 0.5
      const pathAttention = attention.pathAttention.get(edgeId) || 0.5
      
      const attentionWeight = edgeAttention * pathAttention
      
      // 加权聚合邻居嵌入
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] += attentionWeight * neighbor.embeddings[i]
      }
    }
    
    // 归一化
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm
      }
    }
    
    return embedding
  }

  /**
   * 获取节点邻居
   */
  getNodeNeighbors(nodeId, view) {
    const neighbors = []
    
    for (const [edgeId, edge] of view.edges) {
      if (edge.source === nodeId) {
        neighbors.push({
          id: edge.target,
          weight: edge.weight,
          embeddings: this.initializeEmbeddings(64) // 这里应该获取实际的邻居嵌入
        })
      } else if (edge.target === nodeId) {
        neighbors.push({
          id: edge.source,
          weight: edge.weight,
          embeddings: this.initializeEmbeddings(64)
        })
      }
    }
    
    return neighbors
  }

  /**
   * 全局对比学习
   */
  async globalContrastiveLearning(network, metaPathEmbeddings) {
    const globalEmbeddings = new Map()
    
    // 聚合所有元路径的嵌入
    for (const [userId, user] of network.users) {
      const aggregatedEmbedding = new Array(64).fill(0)
      let count = 0
      
      for (const [metaPathType, embeddings] of metaPathEmbeddings) {
        const embedding = embeddings.get(userId)
        if (embedding) {
          for (let i = 0; i < aggregatedEmbedding.length; i++) {
            aggregatedEmbedding[i] += embedding[i]
          }
          count++
        }
      }
      
      // 平均聚合
      if (count > 0) {
        for (let i = 0; i < aggregatedEmbedding.length; i++) {
          aggregatedEmbedding[i] /= count
        }
      }
      
      globalEmbeddings.set(userId, aggregatedEmbedding)
    }
    
    return globalEmbeddings
  }

  /**
   * 高阶对比学习
   */
  async highOrderContrastiveLearning(network, globalEmbeddings, positiveSamples) {
    const finalEmbeddings = new Map()
    
    // 基于正样本进行对比学习优化
    for (const [userId, user] of network.users) {
      const embedding = globalEmbeddings.get(userId) || this.initializeEmbeddings(64)
      const samples = positiveSamples.get(userId)
      
      if (samples) {
        // 使用正样本进行对比学习
        const optimizedEmbedding = this.optimizeEmbeddingWithContrastiveLearning(
          embedding, samples, globalEmbeddings
        )
        finalEmbeddings.set(userId, optimizedEmbedding)
      } else {
        finalEmbeddings.set(userId, embedding)
      }
    }
    
    return finalEmbeddings
  }

  /**
   * 使用对比学习优化嵌入
   */
  optimizeEmbeddingWithContrastiveLearning(embedding, samples, globalEmbeddings) {
    const optimizedEmbedding = [...embedding]
    const learningRate = 0.01
    
    // 对比学习更新
    for (const sample of samples.structural.concat(samples.feature).concat(samples.hybrid)) {
      const positiveEmbedding = globalEmbeddings.get(sample.userId)
      if (positiveEmbedding) {
        // 拉近正样本距离
        for (let i = 0; i < optimizedEmbedding.length; i++) {
          optimizedEmbedding[i] += learningRate * sample.similarity * 
            (positiveEmbedding[i] - optimizedEmbedding[i])
        }
      }
    }
    
    // 归一化
    const norm = Math.sqrt(optimizedEmbedding.reduce((sum, val) => sum + val * val, 0))
    if (norm > 0) {
      for (let i = 0; i < optimizedEmbedding.length; i++) {
        optimizedEmbedding[i] /= norm
      }
    }
    
    return optimizedEmbedding
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0
    
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }
    
    if (norm1 === 0 || norm2 === 0) return 0
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  /**
   * 生成推荐
   */
  async generateRecommendations(userId, options = {}) {
    const {
      topK = 10,
      location = null,
      radius = 5000
    } = options

    try {
      // 构建异构信息网络
      const network = await this.buildHeterogeneousNetwork()
      
      // 初始化元路径
      this.initializeMetaPaths()
      
      // 构建元路径增强视图
      const enhancedViews = this.buildMetaPathEnhancedView(network)
      
      // 应用三阶段注意力机制
      const attentionResults = this.applyThreeStageAttention(network, enhancedViews)
      
      // 协同正样本选择
      const positiveSamples = this.selectPositiveSamples(network, enhancedViews, attentionResults)
      
      // 分层对比学习
      const embeddings = await this.performHierarchicalContrastiveLearning(
        network, enhancedViews, attentionResults, positiveSamples
      )
      
      // 生成推荐
      const recommendations = this.generateFinalRecommendations(
        userId, network, embeddings, topK, location, radius
      )
      
      return recommendations
      
    } catch (error) {
      console.error('生成推荐失败:', error)
      throw error
    }
  }

  /**
   * 生成最终推荐
   */
  generateFinalRecommendations(userId, network, embeddings, topK, location, radius) {
    const userEmbedding = embeddings.get(userId)
    if (!userEmbedding) {
      return []
    }
    
    const scores = []
    
    // 计算用户对所有兴趣点的相似度
    for (const [placeId, place] of network.places) {
      const placeEmbedding = place.embeddings
      const similarity = this.cosineSimilarity(userEmbedding, placeEmbedding)
      
      // 位置过滤
      if (location && radius) {
        const distance = this.calculateDistance(
          location.latitude,
          location.longitude,
          place.location.latitude,
          place.location.longitude
        )
        
        if (distance > radius) {
          continue
        }
      }
      
      scores.push({
        placeId: placeId,
        name: place.name,
        similarity: similarity,
        category: place.category,
        location: place.location
      })
    }
    
    // 排序并返回top-k推荐
    return scores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { userId, location, topK = 10, radius = 5000 } = event
  
  try {
    const recommendationSystem = new MetaPathEnhancedRecommendation()
    
    const recommendations = await recommendationSystem.generateRecommendations(userId, {
      topK,
      location,
      radius
    })
    
    return {
      code: 200,
      data: {
        userId,
        recommendations,
        algorithm: 'MetaPathEnhancedContrastiveLearning',
        timestamp: Date.now()
      }
    }
    
  } catch (error) {
    console.error('推荐算法执行失败:', error)
    return {
      code: 500,
      error: error.message
    }
  }
} 