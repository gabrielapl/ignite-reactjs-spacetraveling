import { useState } from 'react';
import Head from 'next/head';
import { FiCalendar , FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { GetStaticProps } from 'next';
import { PreviewButton } from '../components/previewButton';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPost, setNextPage] = useState(postsPagination.next_page);

  async function handleMorePosts() {

    const response = await fetch(nextPost).then( response => response.json());
    debugger
    const newPost = response.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }
      }
    });

    setPosts(post => [...post, ...newPost])
    setNextPage(response.next_page);
  }

  return (
    <>
       <Head>
          <title>Posts | spacetraveling</title>
        </Head>
        <main className={`${styles.container} ${commonStyles.container}`} >
          <div className={styles.posts}>
            {
               posts.map(post => (
                <Link key={post.uid} href={`/post/${post.uid}`}>
                  <a>
                    <h2>{post.data.title}</h2>
                    <p>{post.data.subtitle}</p>
                    <div>
                      <time><FiCalendar size="20" /> {format(new Date(post.first_publication_date),	"dd MMM yyyy", {
                          locale: ptBR})}
                      </time>
                      <p><FiUser size="20" /> {post.data.author}</p>
                    </div>
                  </a>
                </Link>
               ))
            }
          </div>
          {
            nextPost && (
              <button type="button" onClick={handleMorePosts} >Carregar mais posts</button>
            )
          }
          {preview && (
          <PreviewButton />
		      )}
        </main>
        
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData = null
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at("document.type", "posts")
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 1,
    ref: previewData?.ref ?? null,
  });
  console.log(previewData)
  const result = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: result
  };

  return {
    props: {
      postsPagination,
      preview
    },
    revalidate: 60 * 5,
  }

};    
