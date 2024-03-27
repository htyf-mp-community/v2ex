import { zodResolver } from '@hookform/resolvers/zod'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { RESET } from 'jotai/utils'
import { compact, isString } from 'lodash'
import { Fragment, useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, Text, View, useWindowDimensions } from 'react-native'
import { ScrollView, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { z } from 'zod'

import FormControl from '@/components/FormControl'
import Html from '@/components/Html'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RadioButtonGroup from '@/components/RadioButtonGroup'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledTextInput from '@/components/StyledTextInput'
import UploadImageButton from '@/components/UploadImageButton'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { WriteTopicArgs, topicDraftAtom } from '@/jotai/topicDraftAtom'
import { getUI, uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Topic, k } from '@/servicies'
import { RootStackParamList } from '@/types'
import { isSignined } from '@/utils/authentication'
import { convertSelectedTextToBase64 } from '@/utils/convertSelectedTextToBase64'
import { queryClient } from '@/utils/query'
import { BizError } from '@/utils/request'
import tw from '@/utils/tw'

const LazyPreviewTopic = withQuerySuspense(PreviewTopic, {
  LoadingComponent: () => {
    const navbarHeight = useNavBarHeight()
    const layout = useWindowDimensions()
    return (
      <View
        style={{
          height: layout.height - navbarHeight,
        }}
      >
        <LoadingIndicator />
      </View>
    )
  },
})

export default withQuerySuspense(WriteTopicScreen, {
  LoadingComponent: () => {
    const {
      params: { topic },
    } = useRoute<RouteProp<RootStackParamList, 'WriteTopic'>>()
    const isEdit = !!topic
    return (
      <View style={tw`bg-[${getUI().colors.base100}] flex-1`}>
        <NavBar title={isEdit ? '编辑主题' : '创作新主题'} />
        <LoadingIndicator />
      </View>
    )
  },
  FallbackComponent: props => {
    const {
      params: { topic },
    } = useRoute<RouteProp<RootStackParamList, 'WriteTopic'>>()
    const isEdit = !!topic
    return (
      <View style={tw`bg-[${getUI().colors.base100}] flex-1`}>
        <NavBar title={isEdit ? '编辑主题' : '创作新主题'} />
        <FallbackComponent {...props} />
      </View>
    )
  },
})

function WriteTopicScreen() {
  const {
    params: { topic },
  } = useRoute<RouteProp<RootStackParamList, 'WriteTopic'>>()

  const isEdit = !!topic

  const { data: editTopicInfo } = k.topic.editInfo.useQuery({
    variables: { id: topic?.id! },
    enabled: isEdit,
    // @ts-ignore
    suspense: isEdit,
  })

  const prevTopic = { ...topic, ...editTopicInfo } as Topic

  const { control, handleSubmit, getValues, setValue, watch, reset } = useForm<
    z.infer<typeof WriteTopicArgs>
  >({
    resolver: zodResolver(WriteTopicArgs),
    defaultValues: isEdit ? prevTopic : store.get(topicDraftAtom),
  })

  useEffect(() => {
    const subscription = watch(values => {
      store.set(topicDraftAtom, values)
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const writeTopicMutation = k.topic.write.useMutation()

  const editTopicMutation = k.topic.edit.useMutation()

  const navbarHeight = useNavBarHeight()

  const [preview, setPreview] = useState(false)

  const [showPreviewButton, setShowPreviewButton] = useState(
    !!prevTopic.content
  )

  const inputRef = useRef<TextInput>(null)

  const selectionRef = useRef<{
    start: number
    end: number
  }>()

  const resetForm = () => {
    if (isEdit) {
      reset()
    } else {
      store.set(topicDraftAtom, RESET)
      reset(store.get(topicDraftAtom))
    }
  }

  const { colors } = useAtomValue(uiAtom)

  return (
    <View style={tw`bg-[${colors.base100}] flex-1`}>
      <ScrollView
        style={tw`flex-1 p-4`}
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
      >
        {preview ? (
          <LazyPreviewTopic
            syntax={getValues('syntax')}
            text={getValues('content')!}
            title={getValues('title')}
          />
        ) : (
          <Fragment>
            <FormControl
              control={control}
              name="node"
              label="节点"
              render={({ field: { value, onChange } }) => (
                <Pressable
                  onPress={() => {
                    if (!topic || topic.editable) {
                      navigation.navigate('SearchNode', {
                        onPressNodeItem: onChange,
                      })
                    }
                  }}
                >
                  <StyledTextInput
                    pointerEvents="none"
                    editable={false}
                    value={
                      value
                        ? compact([value.title, value.name]).join(' / ')
                        : undefined
                    }
                    placeholder="请选择主题节点"
                  />
                </Pressable>
              )}
            />

            <FormControl
              control={control}
              name="title"
              label="标题"
              render={({ field: { value, onChange, onBlur } }) => (
                <StyledTextInput
                  placeholder="请输入标题"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <FormControl
              control={control}
              name="content"
              label="正文"
              extra={
                <View style={tw`mb-2`}>
                  <Controller
                    control={control}
                    name="syntax"
                    render={({ field: { value, onChange } }) => (
                      <RadioButtonGroup
                        options={[
                          { label: 'V2EX 原生格式', value: 'default' },
                          { label: 'Markdown', value: 'markdown' },
                        ]}
                        value={value}
                        onChange={onChange}
                      />
                    )}
                  />
                </View>
              }
              render={({ field: { value, onChange, onBlur } }) => (
                <View style={tw`bg-[${colors.base200}] pb-2`}>
                  <StyledTextInput
                    ref={inputRef}
                    placeholder="标题如果能够表达完整内容，则正文可以为空"
                    onChangeText={text => {
                      store.set(topicDraftAtom, getValues())
                      setShowPreviewButton(!!text)
                      onChange(text)
                    }}
                    onSelectionChange={ev => {
                      selectionRef.current = ev.nativeEvent.selection
                    }}
                    onBlur={onBlur}
                    defaultValue={value}
                    multiline
                    style={tw`h-50 py-2`}
                    textAlignVertical="top"
                  />
                  <View style={tw`flex-row gap-2 justify-end px-2`}>
                    <StyledButton
                      size="small"
                      onPress={() => {
                        const replacedText = convertSelectedTextToBase64(
                          getValues('content'),
                          selectionRef.current
                        )

                        if (replacedText) {
                          setValue('content', replacedText)
                          inputRef.current?.setNativeProps({
                            text: replacedText,
                          })
                        }
                      }}
                    >
                      + Base64
                    </StyledButton>

                    <UploadImageButton
                      size="small"
                      onUploaded={url => {
                        const newContent = getValues('content')
                          ? `${getValues('content')}\n${url}`
                          : url

                        setValue('content', newContent)
                        inputRef.current?.setNativeProps({
                          text: newContent,
                        })
                      }}
                    />
                  </View>
                </View>
              )}
            />

            <StyledButton
              style={tw`mt-auto`}
              onPress={() => {
                if (!isSignined()) {
                  navigation.navigate('Login')
                  return
                }

                handleSubmit(async values => {
                  try {
                    if (
                      writeTopicMutation.isPending ||
                      editTopicMutation.isPending
                    )
                      return

                    if (isEdit) {
                      await editTopicMutation.mutateAsync({
                        title: values.title.trim(),
                        content: values.content?.trim(),
                        node_name: values.node.name,
                        syntax: values.syntax === 'default' ? 0 : 1,
                        prevTopic,
                      })

                      queryClient.refetchQueries({
                        queryKey: k.topic.detail.getKey({ id: topic?.id }),
                        type: 'active',
                      })
                    } else {
                      await writeTopicMutation.mutateAsync({
                        title: values.title.trim(),
                        content: values.content?.trim(),
                        node_name: values.node.name,
                        syntax: values.syntax,
                        once: store.get(profileAtom)?.once!,
                      })
                    }

                    Toast.show({
                      type: 'success',
                      text1: isEdit ? `编辑成功` : '发帖成功',
                    })

                    resetForm()

                    navigation.goBack()
                  } catch (error) {
                    Toast.show({
                      type: 'error',
                      text1:
                        error instanceof BizError
                          ? error.message
                          : isEdit
                          ? `编辑失败`
                          : '发帖失败',
                    })
                  }
                })()
              }}
              shape="rounded"
              size="large"
            >
              {isEdit ? '保存' : '发布主题'}
            </StyledButton>
          </Fragment>
        )}

        <SafeAreaView edges={['bottom']} />
      </ScrollView>

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar
          title={isEdit ? '编辑主题' : '创作新主题'}
          right={
            showPreviewButton && (
              <View style={tw`flex-row gap-2`}>
                <StyledButton shape="rounded" ghost onPress={resetForm}>
                  重置
                </StyledButton>
                <StyledButton
                  shape="rounded"
                  onPress={() => setPreview(!preview)}
                >
                  {preview ? '退出预览' : '预览'}
                </StyledButton>
              </View>
            )
          }
        />
      </View>
    </View>
  )
}

function PreviewTopic({
  title,
  ...variables
}: {
  title?: string
  text: string
  syntax: 'default' | 'markdown'
}) {
  const { data } = k.topic.preview.useQuery({
    variables,
    enabled: !!variables.text,
    // @ts-ignore
    suspense: true,
  })

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <Fragment>
      {title && (
        <Text
          style={tw`text-[${colors.foreground}] ${fontSize.xxlarge} font-medium pb-2`}
          selectable
        >
          {title}
        </Text>
      )}

      {isString(data) && <Html source={{ html: data }} paddingX={32} />}
    </Fragment>
  )
}
