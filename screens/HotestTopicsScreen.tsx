import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { findIndex } from 'lodash'
import { memo, useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabBar, TabView } from 'react-native-tab-view'

import Empty from '@/components/Empty'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RefetchingIndicator from '@/components/RefetchingIndicator'
import { LineSeparator } from '@/components/Separator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import TopicItem from '@/components/topic/TopicItem'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { Topic, k } from '@/servicies'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

const TAB_BAR_HEIGHT = 40

export default withQuerySuspense(HotestTopicsScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1`}>
      <NavBar title="历史最热" />
      <TopicPlaceholder />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="历史最热" />
      <FallbackComponent {...props} />
    </View>
  ),
})

const MemoHotestTopics = withQuerySuspense(memo(HotestTopics), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
  LoadingComponent: () => {
    const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <TopicPlaceholder hideAvatar />
      </View>
    )
  },
})

function HotestTopicsScreen() {
  const [index, setIndex] = useState(0)

  const colorScheme = useAtomValue(colorSchemeAtom)

  const layout = useWindowDimensions()

  const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT

  const routes = useMemo(() => {
    return [
      {
        title: '最新上榜',
        key: 'newest',
      },
      {
        title: '三天最热',
        key: 'hottest-3',
      },
      {
        title: '七天最热',
        key: 'hottest-7',
      },
      {
        title: '30天最热',
        key: 'hottest-30',
      },
      ...Array.from({ length: 7 })
        .map((_, i) =>
          dayjs()
            .subtract(i + 1, 'day')
            .format('YYYY-MM-DD')
        )
        .map(date => ({
          title:
            date === dayjs().subtract(1, 'day').format('YYYY-MM-DD')
              ? '昨天'
              : date === dayjs().subtract(2, 'day').format('YYYY-MM-DD')
              ? '前天'
              : dayjs(date).format('MM-DD'),
          key: `${dayjs(date).year()}/${date}`,
        })),
    ]
  }, [])

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw`flex-1`}>
      <TabView
        key={colorScheme}
        navigationState={{ index, routes }}
        lazy
        lazyPreloadDistance={1}
        renderScene={({ route }) => (
          <MemoHotestTopics headerHeight={headerHeight} tab={route.key} />
        )}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        tabBarPosition="bottom"
        renderTabBar={props => (
          <View style={tw`absolute top-0 inset-x-0 z-10`}>
            <StyledBlurView style={tw`absolute inset-0`} />

            <NavBar title="历史最热" style={tw`border-b-0`} />
            <View
              style={tw`px-4 border-b border-[${colors.divider}] border-solid h-[${TAB_BAR_HEIGHT}px]`}
            >
              <TabBar
                {...props}
                scrollEnabled
                style={tw`flex-row flex-1 shadow-none bg-transparent`}
                tabStyle={tw`w-auto h-[${TAB_BAR_HEIGHT}px]`}
                indicatorStyle={tw`bg-[${colors.foreground}] h-1 rounded-full`}
                indicatorContainerStyle={tw`border-b-0`}
                gap={16}
                renderTabBarItem={tabBarItemProps => {
                  const { route } = tabBarItemProps
                  const active = routes[index].key === route.key

                  return (
                    <TouchableOpacity
                      {...tabBarItemProps}
                      key={route.key}
                      style={tw`w-auto flex-row items-center justify-center h-[${TAB_BAR_HEIGHT}px]`}
                      activeOpacity={active ? 1 : 0.5}
                      onPress={() => {
                        setIndex(findIndex(routes, { key: route.key }))
                      }}
                    >
                      <Text
                        style={tw.style(
                          fontSize.medium,
                          active
                            ? tw`text-[${colors.foreground}] font-medium`
                            : tw`text-[${colors.default}]`
                        )}
                      >
                        {route.title}
                      </Text>
                    </TouchableOpacity>
                  )
                }}
              />
            </View>
          </View>
        )}
      />
    </View>
  )
}

function HotestTopics({
  headerHeight,
  tab,
}: {
  tab: string
  headerHeight: number
}) {
  const { data, refetch, isFetching } = k.topic.hotest.useSuspenseQuery({
    variables: { tab },
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => <TopicItem key={item.id} topic={item} />,
    []
  )

  return (
    <RefetchingIndicator
      isRefetching={isFetching && !isRefetchingByUser}
      progressViewOffset={headerHeight}
    >
      <FlatList
        data={data}
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
            progressViewOffset={headerHeight}
          />
        }
        contentContainerStyle={{
          paddingTop: headerHeight,
        }}
        ItemSeparatorComponent={LineSeparator}
        ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        renderItem={renderItem}
        ListEmptyComponent={<Empty description="目前还没有主题" />}
      />
    </RefetchingIndicator>
  )
}
