import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { LoadingPage, PageDetail, PageDetails, Scrollable } from '../../../../framework';
import { PageDetailCodeEditor } from '../../../../framework/PageDetails/PageDetailCodeEditor';
import { formatDateString } from '../../../../framework/utils/formatDateString';
import { AwxItemsResponse } from '../../../awx/common/AwxItemsResponse';
import { StatusCell } from '../../../common/Status';
import { useGet, useGetItem } from '../../../common/crud/useGet';
import { PageDetailsSection } from '../../common/PageDetailsSection';
import { API_PREFIX, SWR_REFRESH_INTERVAL } from '../../constants';
import { EdaActivationInstance } from '../../interfaces/EdaActivationInstance';
import { EdaActivationInstanceLog } from '../../interfaces/EdaActivationInstanceLog';

export function ActivationInstanceDetails() {
  const { t } = useTranslation();
  const params = useParams<{ instanceId: string }>();
  const { data: activationInstance } = useGetItem<EdaActivationInstance>(
    `${API_PREFIX}/activation-instances/`,
    params.instanceId
  );
  const { data: activationInstanceLogInfo } = useGet<AwxItemsResponse<EdaActivationInstanceLog>>(
    `${API_PREFIX}/activation-instances/${params.instanceId ?? ''}/logs/?page_size=1`,
    undefined,
    { refreshInterval: SWR_REFRESH_INTERVAL }
  );
  const { data: activationInstanceLog } = useGet<AwxItemsResponse<EdaActivationInstanceLog>>(
    `${API_PREFIX}/activation-instances/${params.instanceId ?? ''}/logs/?page_size=${
      activationInstanceLogInfo?.count || 10
    }`,
    undefined,
    { refreshInterval: SWR_REFRESH_INTERVAL }
  );
  if (!activationInstance) {
    return <LoadingPage />;
  }
  return (
    <Scrollable>
      <PageDetails>
        <PageDetail label={t('Name')}>
          {`${activationInstance?.id || ''} - ${activationInstance?.name || ''}`}
        </PageDetail>
        <PageDetail label={t('Status')}>
          {<StatusCell status={activationInstance?.status || 'unknown'} />}
        </PageDetail>
        <PageDetail label={t('Start date')}>
          {activationInstance?.started_at ? formatDateString(activationInstance?.started_at) : ''}
        </PageDetail>
        <PageDetail label={t('End date')}>
          {activationInstance?.ended_at ? formatDateString(activationInstance?.ended_at) : ''}
        </PageDetail>
      </PageDetails>
      <PageDetailsSection>
        {activationInstanceLog?.results?.length ? (
          <PageDetailCodeEditor
            label={t('Output')}
            value={activationInstanceLog?.results?.map((item) => item.log).join('\r\n')}
            showCopyToClipboard={true}
          />
        ) : null}
      </PageDetailsSection>
    </Scrollable>
  );
}