import styles from '../../styles/pages.module.css';

export function FATD() {
  return (
    <div>
      <div className={styles['page-header']}>
        <p className={styles['page-header__eyebrow']}>Sargenteação</p>
        <h1>FATD</h1>
        <p>Folha de Alterações de Tropa Diária.</p>
      </div>
      <div className={styles['empty-page']}>
        <span className={styles['empty-page__icon']}>📄</span>
        <h2>Em desenvolvimento</h2>
        <p>O formulário de FATD será implementado em breve.</p>
      </div>
    </div>
  );
}
